import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { gameCards } from "../db/schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Transaction;

export type NewGameCard = {
  gameId: number;
  position: number;
  pairKey: number;
};

export type GameCardRow = {
  position: number;
  pairKey: number;
  matched: boolean;
};

const gameCardColumns = {
  position: gameCards.position,
  pairKey: gameCards.pairKey,
  matched: gameCards.matched,
};

// 純粋なデータアクセスのみ。シャッフルやターン判定は service 層の責務。
export const gameCardRepository = {
  // 盤面生成時のバルクインサート
  async insertMany(cards: NewGameCard[], executor: Executor = db): Promise<void> {
    await executor.insert(gameCards).values(cards);
  },

  // ゲームの全カードを position 順で取得
  async findByGameId(
    gameId: number,
    executor: Executor = db,
  ): Promise<GameCardRow[]> {
    return executor
      .select(gameCardColumns)
      .from(gameCards)
      .where(eq(gameCards.gameId, gameId))
      .orderBy(asc(gameCards.position));
  },

  // 特定 position の1枚を取得（flip 時の検証用）
  async findOne(
    gameId: number,
    position: number,
    executor: Executor = db,
  ): Promise<GameCardRow | undefined> {
    const [card] = await executor
      .select(gameCardColumns)
      .from(gameCards)
      .where(and(eq(gameCards.gameId, gameId), eq(gameCards.position, position)));
    return card;
  },

  // 一致確定時に2枚まとめて matched=true にする
  async markMatched(
    gameId: number,
    positions: number[],
    executor: Executor = db,
  ): Promise<void> {
    await executor
      .update(gameCards)
      .set({ matched: true })
      .where(
        and(eq(gameCards.gameId, gameId), inArray(gameCards.position, positions)),
      );
  },

  // ゲームの全カードが matched かどうか
  async allMatched(gameId: number, executor: Executor = db): Promise<boolean> {
    const [row] = await executor
      .select({
        remaining: sql<number>`count(*) filter (where not ${gameCards.matched})`,
      })
      .from(gameCards)
      .where(eq(gameCards.gameId, gameId));
    return Number(row?.remaining ?? 0) === 0;
  },

  // やり直し用: ゲームの盤面をまるごと削除する（呼び出し側で insertMany し直す）
  async deleteByGameId(gameId: number, executor: Executor = db): Promise<void> {
    await executor.delete(gameCards).where(eq(gameCards.gameId, gameId));
  },
};
