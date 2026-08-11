import { importPKCS8, SignJWT } from "jose";
import { env } from "../../config/env.js";

// 別アプリ（external-api）へイベントを送るクライアント。
// 相手はこのリポジトリ内の別ワークスペースだが、DB も別・プロセスも別の
// 「外部サービス」として扱う。やり取りは HTTP と署名だけ。
//
// 認証は公開鍵方式。こちらが秘密鍵で JWT に署名し、相手は登録済みの公開鍵で
// 検証する。鍵そのものはネットワークに流れない。

export type GameCreatedEvent = {
  gameId: number;
  accountId: number;
  gameName: string;
  size: number;
  occurredAt: Date;
};

// 相手が落ちている・遅いときに、こちらのリクエストを長く待たせないための上限。
// 外部サービス呼び出しには必ずタイムアウトを付ける（付けないと相手の障害が
// そのままこちらの障害になる）。
const TIMEOUT_MS = 3000;

// 署名方式。相手が受け入れる方式と一致させる。
const ALGORITHM = "EdDSA";

// トークンの宛先。相手が名乗っている名前を入れる。
// これを見て相手は「自分宛のトークンか」を確かめる。
const AUDIENCE = "external-api";

// トークンの有効期限。毎回その場で作るので短くてよい。
// 万一漏れても使える時間がこれだけに限られる。
const EXPIRES_IN = "5m";

// PEM から鍵オブジェクトへの変換は毎回やる必要がないので、最初の 1 回だけ行う。
const privateKeyPromise = importPKCS8(env.EXTERNAL_API_PRIVATE_KEY, ALGORITHM);

/** 送信のたびに使い捨ての通行証（JWT）を作る。保存はしない。 */
async function createToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuer(env.EXTERNAL_API_CLIENT_ID)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(await privateKeyPromise);
}

export const externalApiClient = {
  /**
   * ゲーム作成イベントを送る。
   *
   * 送信に失敗した場合は例外を投げる。握りつぶすかどうかは呼び出し側が決める。
   */
  async sendGameCreated(event: GameCreatedEvent): Promise<void> {
    const token = await createToken();

    const response = await fetch(`${env.EXTERNAL_API_URL}/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // 秘密鍵で署名した JWT。ユーザーのトークンとは別物で、
        // 「どのシステムからの呼び出しか」を相手に示す。
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: "game.created",
        source: "memory-game",
        gameId: event.gameId,
        accountId: event.accountId,
        gameName: event.gameName,
        size: event.size,
        // JSON に日時型は無いので ISO 8601 の文字列で送る
        occurredAt: event.occurredAt.toISOString(),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // fetch は 4xx / 5xx でも例外を投げない（通信できた時点で成功扱い）。
    // ステータスは自分で見る必要がある。
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `external-api への送信に失敗しました (status=${response.status}): ${body}`,
      );
    }
  },
};
