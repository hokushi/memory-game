import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthenticatedError } from "../errors.js";

// 認証ミドルウェア。
// Cookie のアクセストークン(JWT)を検証し、payload を request.user に載せる。
// 失敗（トークン無し・無効・期限切れ）なら 401 を返す。
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify();
  } catch {
    await reply.code(401).send({ error: new UnauthenticatedError().message });
  }
}
