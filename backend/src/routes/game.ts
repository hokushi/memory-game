import type { FastifyInstance } from "fastify";
import { gameController } from "../controllers/game.js";
import { photoController } from "../controllers/photo.js";

// size は 4 / 6 / 8 のみ（DB の CHECK 制約と一致）
const createGameBodySchema = {
  type: "object",
  required: ["name", "size"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 50 },
    size: { type: "integer", enum: [4, 6, 8] },
  },
} as const;

// URL の :gameId（文字列で来るので integer に型強制する）
const gameParamsSchema = {
  type: "object",
  required: ["gameId"],
  properties: {
    gameId: { type: "integer" },
  },
} as const;

// 8×8 のとき写真は最大 32 枚（64 マス / 2）なので上限を 32 にする
const MAX_PHOTOS = 32;

// 署名付き URL 発行リクエスト。各ファイルの Content-Type を受け取る。
// 例:
// {
//   "files": [
//     { "contentType": "image/png" },
//     { "contentType": "image/jpeg" }
//   ]
// }
const presignBodySchema = {
  type: "object",
  required: ["files"],
  additionalProperties: false,
  properties: {
    files: {
      type: "array",
      minItems: 1,
      maxItems: MAX_PHOTOS,
      items: {
        type: "object",
        required: ["contentType"],
        additionalProperties: false,
        properties: {
          // 画像のみ許可する
          contentType: { type: "string", pattern: "^image/" },
        },
      },
    },
  },
} as const;

// アップロード済みキーの保存リクエスト
// 例:
// {
//   "keys": [
//     "games/123/a1b2c3d4-5e6f-7890-abcd-ef1234567890",
//     "games/123/b2c3d4e5-6f70-8901-bcde-f12345678901"
//   ]
// }
const savePhotosBodySchema = {
  type: "object",
  required: ["keys"],
  additionalProperties: false,
  properties: {
    keys: {
      type: "array",
      minItems: 1,
      maxItems: MAX_PHOTOS,
      items: { type: "string", minLength: 1 },
    },
  },
} as const;

export async function gameRoutes(app: FastifyInstance) {
  // 認証は呼び出し側のスコープ（app.ts の認証必須スコープ）で適用される
  app.post(
    "/games",
    { schema: { body: createGameBodySchema } },
    gameController.create,
  );

  // ログイン中アカウントのゲーム一覧
  app.get("/games", gameController.list);

  // 写真アップロード用の署名付き URL を発行する
  app.post(
    "/games/:gameId/photos/presign",
    { schema: { params: gameParamsSchema, body: presignBodySchema } },
    photoController.presign,
  );

  // アップロード済みのキーをゲームの写真として保存する
  app.post(
    "/games/:gameId/photos",
    { schema: { params: gameParamsSchema, body: savePhotosBodySchema } },
    photoController.save,
  );
}
