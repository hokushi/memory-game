import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "../infrastructure/s3/index.js";
import { gameRepository } from "../infrastructure/repositories/game.js";
import {
  photoRepository,
  type GamePhoto,
} from "../infrastructure/repositories/photo.js";
import { GameNotFoundError } from "../errors.js";

// 署名付き URL の有効期限（秒）。アップロードが終わる程度の短さにする。
const UPLOAD_URL_TTL_SECONDS = 300;

export type PhotoUploadRequest = {
  contentType: string;
};

export type PhotoUpload = {
  // フロントが S3 に PUT する一時 URL
  url: string;
  // 後で savePhotos に渡す S3 オブジェクトキー
  key: string;
};

// あるゲームの写真キーの接頭辞。保存時にこの配下のキーだけ受け付ける。
const keyPrefix = (gameId: number) => `games/${gameId}/`;

// ゲームがログイン中アカウントの所有であることを確認する。
// 無ければ（他人のものを含め）GameNotFoundError。
async function assertOwnership(accountId: number, gameId: number) {
  const game = await gameRepository.findOwnership(gameId);
  if (!game || game.accountId !== accountId) {
    throw new GameNotFoundError();
  }
}

export const photoService = {
  // 各ファイルに対して S3 への署名付き PUT URL を発行する。
  // この時点では DB には何も書かない（アップロード成功後に savePhotos する）。
  async createUploadUrls(
    accountId: number,
    gameId: number,
    files: PhotoUploadRequest[],
  ): Promise<PhotoUpload[]> {
    await assertOwnership(accountId, gameId);

    return Promise.all(
      files.map(async ({ contentType }) => {
        const key = `${keyPrefix(gameId)}${randomUUID()}`;
        const command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          ContentType: contentType,
        });
        const url = await getSignedUrl(s3, command, {
          expiresIn: UPLOAD_URL_TTL_SECONDS,
        });
        return { url, key };
      }),
    );
  },

  // アップロード済みのキーを DB に保存する（ゲームの写真を丸ごと入れ替え）。
  async savePhotos(
    accountId: number,
    gameId: number,
    keys: string[],
  ): Promise<GamePhoto[]> {
    await assertOwnership(accountId, gameId);

    // このゲーム配下のキー以外は弾く（他ゲームへの混入・不正キー対策）
    const prefix = keyPrefix(gameId);
    if (!keys.every((key) => key.startsWith(prefix))) {
      throw new GameNotFoundError();
    }

    return photoRepository.replaceForGame(gameId, keys);
  },
};
