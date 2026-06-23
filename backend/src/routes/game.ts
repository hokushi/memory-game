import type { FastifyInstance } from "fastify";
import { gameController } from "../controllers/game.js";

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

export async function gameRoutes(app: FastifyInstance) {
  // 認証は呼び出し側のスコープ（app.ts の認証必須スコープ）で適用される
  app.post(
    "/games",
    { schema: { body: createGameBodySchema } },
    gameController.create,
  );

  // ログイン中アカウントのゲーム一覧
  app.get("/games", gameController.list);
}
