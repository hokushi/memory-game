import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";

/**
 * x-api-key ヘッダーで呼び出し元を確認する。
 *
 * 外部に公開する API なので、誰でも書き込めてしまわないように鍵を要求する。
 * ユーザーのログイン（Cognito のトークン）とは別物で、
 * 「どのアプリからの呼び出しか」だけを確かめる仕組み。
 *
 * onRequest フックで使う（app.ts 参照）。ボディの検証より先に弾きたいため。
 */
export async function requireApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const apiKey = request.headers["x-api-key"];

  if (apiKey !== env.API_KEY) {
    // 鍵が違う理由（未指定なのか不一致なのか）は返さない
    return reply.code(401).send({ error: "APIキーが正しくありません" });
  }
}
