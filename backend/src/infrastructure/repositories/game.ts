import { db } from "../db/index.js";
import { games } from "../db/schema.js";

export type NewGame = {
  name: string;
  size: number;
};

export type Game = {
  id: number;
  name: string;
  size: number;
  createdAt: Date;
};

// 純粋なデータアクセスのみ。
export const gameRepository = {
  async create(data: NewGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(data)
      .returning({
        id: games.id,
        name: games.name,
        size: games.size,
        createdAt: games.createdAt,
      });

    if (!game) {
      throw new Error("ゲームの作成に失敗しました");
    }
    return game;
  },
};
