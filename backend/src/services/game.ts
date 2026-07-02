import { db } from "../infrastructure/db/index.js";
import { gameRepository, type Game } from "../infrastructure/repositories/game.js";
import { gameCardRepository } from "../infrastructure/repositories/gameCard.js";
import { GameNotFoundError, InvalidMoveError } from "../errors.js";

export type CreateGameInput = {
  accountId: number;
  name: string;
  size: number;
};

export type BoardCardView = {
  position: number;
  matched: boolean;
  pairKey: number | null;
};

export type BoardView = {
  size: number;
  completed: boolean;
  pendingFlipPosition: number | null;
  cards: BoardCardView[];
};

export type FlipResult =
  | { status: "pending"; position: number; pairKey: number }
  | { status: "mismatch"; positions: [number, number]; pairKeys: [number, number] }
  | {
      status: "matched";
      positions: [number, number];
      pairKey: number;
      completed: boolean;
    };

// size*size 枚のカードに (size*size)/2 種類の pairKey を2枚ずつ割り当て、シャッフルする。
// size は常に 4/6/8（DB の CHECK 制約）なので size*size は必ず偶数。
function generateBoard(size: number): number[] {
  const pairCount = (size * size) / 2;
  const pairKeys = Array.from({ length: pairCount }, (_, i) => i).flatMap((k) => [
    k,
    k,
  ]);

  for (let i = pairKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pairKeys[i]!;
    pairKeys[i] = pairKeys[j]!;
    pairKeys[j] = temp;
  }

  return pairKeys;
}

// 所有者チェック。存在しない／他アカウントのゲームは同じエラーにする
// （どのゲームIDが存在するかを他アカウントに漏らさないため）。
async function getOwnedGame(gameId: number, accountId: number) {
  const game = await gameRepository.findById(gameId);
  if (!game || game.accountId !== accountId) {
    throw new GameNotFoundError();
  }
  return game;
}

export const gameService = {
  async create(input: CreateGameInput): Promise<Game> {
    return db.transaction(async (tx) => {
      const game = await gameRepository.create(input, tx);
      const board = generateBoard(input.size);
      await gameCardRepository.insertMany(
        board.map((pairKey, position) => ({ gameId: game.id, position, pairKey })),
        tx,
      );
      return game;
    });
  },

  // ログイン中アカウントのゲーム一覧
  async listByAccount(accountId: number): Promise<Game[]> {
    return gameRepository.findByAccountId(accountId);
  },

  // 盤面を取得する。未確定のカードは pairKey を伏せる
  // （matched 済み、または現在めくり中(pending)の1枚だけ値を返す）。
  async getBoard(gameId: number, accountId: number): Promise<BoardView> {
    const game = await getOwnedGame(gameId, accountId);
    const cards = await gameCardRepository.findByGameId(gameId);

    return {
      size: game.size,
      completed: game.completedAt !== null,
      pendingFlipPosition: game.pendingFlipPosition,
      cards: cards.map((card) => ({
        position: card.position,
        matched: card.matched,
        pairKey:
          card.matched || card.position === game.pendingFlipPosition
            ? card.pairKey
            : null,
      })),
    };
  },

  // カードを1枚めくる。
  async flip(
    gameId: number,
    accountId: number,
    position: number,
  ): Promise<FlipResult> {
    const owned = await getOwnedGame(gameId, accountId);

    if (owned.completedAt !== null) {
      throw new InvalidMoveError("このゲームは既に完了しています");
    }
    if (position < 0 || position >= owned.size * owned.size) {
      throw new InvalidMoveError("position が範囲外です");
    }

    return db.transaction(async (tx) => {
      // 同時flip対策: ゲーム行をロックしてから最新の pendingFlipPosition を読む
      const game = await gameRepository.findByIdForUpdate(gameId, tx);
      if (!game) {
        throw new GameNotFoundError();
      }

      const card = await gameCardRepository.findOne(gameId, position, tx);
      if (!card) {
        throw new InvalidMoveError("position が範囲外です");
      }
      if (card.matched) {
        throw new InvalidMoveError("既に揃っているカードです");
      }

      if (game.pendingFlipPosition === null) {
        // 1枚目
        await gameRepository.setPendingFlip(gameId, position, tx);
        return { status: "pending", position, pairKey: card.pairKey };
      }

      // 2枚目
      if (position === game.pendingFlipPosition) {
        throw new InvalidMoveError("同じカードを2回めくることはできません");
      }

      const first = await gameCardRepository.findOne(
        gameId,
        game.pendingFlipPosition,
        tx,
      );
      if (!first) {
        throw new InvalidMoveError("position が範囲外です");
      }

      if (first.pairKey === card.pairKey) {
        await gameCardRepository.markMatched(gameId, [first.position, position], tx);
        await gameRepository.setPendingFlip(gameId, null, tx);

        const complete = await gameCardRepository.allMatched(gameId, tx);
        if (complete) {
          await gameRepository.markCompleted(gameId, tx);
        }

        return {
          status: "matched",
          positions: [first.position, position],
          pairKey: card.pairKey,
          completed: complete,
        };
      }

      await gameRepository.setPendingFlip(gameId, null, tx);
      return {
        status: "mismatch",
        positions: [first.position, position],
        pairKeys: [first.pairKey, card.pairKey],
      };
    });
  },

  // ゲームをやり直す。盤面を新しくシャッフルし直し、進行状況（めくり中・完了）をリセットする。
  // 進行中・完了済みいずれの状態からでも呼べる。
  async restart(gameId: number, accountId: number): Promise<BoardView> {
    const owned = await getOwnedGame(gameId, accountId);

    await db.transaction(async (tx) => {
      await gameCardRepository.deleteByGameId(gameId, tx);
      const board = generateBoard(owned.size);
      await gameCardRepository.insertMany(
        board.map((pairKey, position) => ({ gameId, position, pairKey })),
        tx,
      );
      await gameRepository.resetProgress(gameId, tx);
    });

    return gameService.getBoard(gameId, accountId);
  },
};
