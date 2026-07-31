import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { games } from "../db/schema.js";

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

const gameColumns = {
  id: games.id,
  name: games.name,
  size: games.size,
  createdAt: games.createdAt,
};

// 純粋なデータアクセスのみ。
export const gameRepository = {
  async create(data: NewGame): Promise<Game> {
    const [game] = await db.insert(games).values(data).returning(gameColumns);

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

  // 所有者チェック用に id と accountId を取得する（存在しなければ undefined）
  async findOwnership(
    id: number,
  ): Promise<{ id: number; accountId: number } | undefined> {
    const [row] = await db
      .select({ id: games.id, accountId: games.accountId })
      .from(games)
      .where(eq(games.id, id))
      .limit(1);
    return row;
  },

  // 指定アカウントが所有する1件のゲームを取得する（無ければ undefined）
  async findByIdAndAccount(
    id: number,
    accountId: number,
  ): Promise<Game | undefined> {
    const [game] = await db
      .select(gameColumns)
      .from(games)
      .where(and(eq(games.id, id), eq(games.accountId, accountId)))
      .limit(1);
    return game;
  },
};
