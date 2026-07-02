import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { games } from "../db/schema.js";

// リポジトリ関数はトランザクション内でも呼べるよう、実行コンテキストを
// 差し替え可能にしておく（省略時はモジュール共通の db を使う）。
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Transaction;

export type NewGame = {
  accountId: number;
  name: string;
  size: number;
};

export type Game = {
  id: number;
  name: string;
  size: number;
  createdAt: Date;
};

export type GameOwnerRow = {
  id: number;
  accountId: number;
  size: number;
  completedAt: Date | null;
  pendingFlipPosition: number | null;
};

const gameColumns = {
  id: games.id,
  name: games.name,
  size: games.size,
  createdAt: games.createdAt,
};

// 純粋なデータアクセスのみ。
export const gameRepository = {
  async create(data: NewGame, executor: Executor = db): Promise<Game> {
    const [game] = await executor
      .insert(games)
      .values(data)
      .returning(gameColumns);

    if (!game) {
      throw new Error("ゲームの作成に失敗しました");
    }
    return game;
  },

  // 指定アカウントのゲームを新しい順で取得する
  async findByAccountId(accountId: number): Promise<Game[]> {
    return db
      .select(gameColumns)
      .from(games)
      .where(eq(games.accountId, accountId))
      .orderBy(desc(games.createdAt));
  },

  // 所有者チェック・flip 処理に使う内部状態込みの1件取得
  async findById(
    id: number,
    executor: Executor = db,
  ): Promise<GameOwnerRow | undefined> {
    const [game] = await executor
      .select({
        id: games.id,
        accountId: games.accountId,
        size: games.size,
        completedAt: games.completedAt,
        pendingFlipPosition: games.pendingFlipPosition,
      })
      .from(games)
      .where(eq(games.id, id));
    return game;
  },

  // 行ロック付きで1件取得する（flip の read-modify-write を直列化するため）
  async findByIdForUpdate(
    id: number,
    executor: Executor,
  ): Promise<GameOwnerRow | undefined> {
    const [game] = await executor
      .select({
        id: games.id,
        accountId: games.accountId,
        size: games.size,
        completedAt: games.completedAt,
        pendingFlipPosition: games.pendingFlipPosition,
      })
      .from(games)
      .where(eq(games.id, id))
      .for("update");
    return game;
  },

  async setPendingFlip(
    gameId: number,
    position: number | null,
    executor: Executor = db,
  ): Promise<void> {
    await executor
      .update(games)
      .set({ pendingFlipPosition: position })
      .where(eq(games.id, gameId));
  },

  async markCompleted(gameId: number, executor: Executor = db): Promise<void> {
    await executor
      .update(games)
      .set({ completedAt: new Date() })
      .where(eq(games.id, gameId));
  },

  // やり直し用: ターン状態・完了状態をクリアする
  async resetProgress(gameId: number, executor: Executor = db): Promise<void> {
    await executor
      .update(games)
      .set({ pendingFlipPosition: null, completedAt: null })
      .where(eq(games.id, gameId));
  },
};
