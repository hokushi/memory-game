import type { FastifyInstance } from "fastify";
import { eventController } from "../controllers/event.js";

// 受け付けるイベント。今は memory-game のゲーム作成のみ。
const createEventBodySchema = {
  type: "object",
  required: [
    "type",
    "source",
    "gameId",
    "accountId",
    "gameName",
    "size",
    "occurredAt",
  ],
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["game.created"] },
    source: { type: "string", minLength: 1, maxLength: 50 },
    gameId: { type: "integer" },
    accountId: { type: "integer" },
    gameName: { type: "string", minLength: 1, maxLength: 50 },
    size: { type: "integer", enum: [4, 6, 8] },
    // ISO 8601 の日時文字列（例: 2026-08-11T10:00:00.000Z）
    occurredAt: { type: "string", format: "date-time" },
  },
} as const;

// 一覧の件数指定。未指定なら 20 件。
const listEventsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
} as const;

export async function eventRoutes(app: FastifyInstance) {
  // APIキーの確認は呼び出し側のスコープ（app.ts）で適用される
  app.post(
    "/events",
    { schema: { body: createEventBodySchema } },
    eventController.create,
  );

  app.get(
    "/events",
    { schema: { querystring: listEventsQuerySchema } },
    eventController.list,
  );
}
