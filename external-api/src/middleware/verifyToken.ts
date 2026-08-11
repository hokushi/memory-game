import type { FastifyReply, FastifyRequest } from "fastify";
import { decodeJwt, importSPKI, jwtVerify } from "jose";
import { clientRepository } from "../infrastructure/repositories/client.js";

// 受け入れる署名方式をここで 1 つに固定する。
// 「トークンに書いてある alg を信じる」実装にすると、alg を none や共通鍵方式に
// すり替えて検証をすり抜ける古典的な攻撃が通ってしまう。
const ALGORITHM = "EdDSA";

// このAPIを指す名前。トークンの aud がこれと一致しないと受け付けない。
// 「別のサービス宛にもらったトークンを、こちらに使い回す」のを防ぐため。
const AUDIENCE = "external-api";

// サーバ同士の時計のズレを許容する秒数。
// これが 0 だと、数秒ズレただけで「まだ有効なのに期限切れ」になる。
const CLOCK_TOLERANCE_SEC = 30;

// PEM から鍵オブジェクトへの変換は毎回やると無駄なので、client_id ごとに覚えておく。
// 鍵を差し替えたときは再起動で消える程度の、軽いキャッシュ。
type PublicKey = Awaited<ReturnType<typeof importSPKI>>;
const keyCache = new Map<string, PublicKey>();

/**
 * Authorization ヘッダーの JWT を、DB に登録された公開鍵で検証する。
 *
 * 流れ:
 *   1. Bearer トークンを取り出す
 *   2. 署名を検証せずに iss（＝client_id）だけ読む … どの鍵を引くかを知るため
 *   3. その client_id で clients テーブルを引き、公開鍵を得る
 *   4. その公開鍵で署名・有効期限・宛先(aud)・名乗り(iss)をまとめて検証する
 *
 * 2 の時点では中身を一切信用していない点が大事。
 * 「本当にその相手か」は 4 の検証を通って初めて確定する。
 */
export async function verifyToken(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "トークンがありません" });
  }
  const token = authorization.slice("Bearer ".length);

  // --- 2. 署名を見ずに iss だけ取り出す ---
  let clientId: string;
  try {
    const claims = decodeJwt(token);
    if (!claims.iss) {
      return reply.code(401).send({ error: "トークンが正しくありません" });
    }
    clientId = claims.iss;
  } catch {
    return reply.code(401).send({ error: "トークンが正しくありません" });
  }

  // --- 3. 公開鍵を DB から引く ---
  const client = await clientRepository.findByClientId(clientId);
  if (!client) {
    // 登録のない相手。存在するかどうかは伝えない
    return reply.code(401).send({ error: "トークンが正しくありません" });
  }

  // --- 4. 公開鍵で検証する ---
  try {
    let publicKey = keyCache.get(client.clientId);
    if (!publicKey) {
      publicKey = await importSPKI(client.publicKey, ALGORITHM);
      keyCache.set(client.clientId, publicKey);
    }

    await jwtVerify(token, publicKey, {
      algorithms: [ALGORITHM],
      issuer: client.clientId,
      audience: AUDIENCE,
      clockTolerance: CLOCK_TOLERANCE_SEC,
    });
  } catch {
    // 署名が偽物 / 期限切れ / 宛先違い。理由は返さない
    return reply.code(401).send({ error: "トークンが正しくありません" });
  }

  request.client = { clientId: client.clientId, name: client.name };
}
