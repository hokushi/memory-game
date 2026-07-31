import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { gamePhotos } from "../db/schema.js";

export type GamePhoto = {
  id: number;
  s3Key: string;
};

// gameId 付きの写真（複数ゲームをまとめて取得するとき用）
export type GamePhotoWithGameId = {
  gameId: number;
  s3Key: string;
};

const photoColumns = {
  id: gamePhotos.id,
  s3Key: gamePhotos.s3Key,
};

// 純粋なデータアクセスのみ。
export const photoRepository = {
  // ゲームの写真を入れ替える（既存を消して与えられたキーで作り直す）。
  // 「写真確定」を押し直しても重複しないよう、まるごと置き換える。
  async replaceForGame(gameId: number, keys: string[]): Promise<GamePhoto[]> {
    return db.transaction(async (tx) => {
      await tx.delete(gamePhotos).where(eq(gamePhotos.gameId, gameId));

      if (keys.length === 0) return [];

      return tx
        .insert(gamePhotos)
        .values(keys.map((s3Key) => ({ gameId, s3Key })))
        .returning(photoColumns);
    });
  },

  // 複数ゲームの写真を一括取得する（一覧表示で N+1 を避けるため）。
  // 挿入順（id 昇順）で返す。
  async findByGameIds(gameIds: number[]): Promise<GamePhotoWithGameId[]> {
    if (gameIds.length === 0) return [];

    return db
      .select({ gameId: gamePhotos.gameId, s3Key: gamePhotos.s3Key })
      .from(gamePhotos)
      .where(inArray(gamePhotos.gameId, gameIds))
      .orderBy(asc(gamePhotos.id));
  },
};
