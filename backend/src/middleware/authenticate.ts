import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthenticatedError } from "../errors.js";
import { accessTokenVerifier } from "../infrastructure/cognito/index.js";
import { accountRepository } from "../infrastructure/repositories/account.js";

// 認証ミドルウェア。
// Cookie に入っている Cognito のアクセストークンを検証し、
// そのユーザーの accountId を request.user に載せる。
// 失敗（トークン無し・無効・期限切れ）なら 401 を返す。
//
// 検証は Cognito の公開鍵（jwks.json）で行うため、
// リクエストのたびに AWS へ問い合わせる必要はない。
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.cookies.access_token;
  if (!token) {
    return reply
      .code(401)
      .send({ error: new UnauthenticatedError().message });
  }

  try {
    // 署名・有効期限・発行元・宛先クライアントをまとめて検証する
    const payload = await accessTokenVerifier.verify(token);

    // トークンが持っているのは Cognito の sub だけなので、
    // アプリ側の accountId はここで引き直す。
    const account = await accountRepository.findByCognitoSub(payload.sub);
    if (!account) {
      // Cognito には居るが DB に居ない。未認証として扱う。
      return reply
        .code(401)
        .send({ error: new UnauthenticatedError().message });
    }

    request.user = { accountId: account.id };
  } catch {
    return reply
      .code(401)
      .send({ error: new UnauthenticatedError().message });
  }
}
