import { env } from "../../config/env.js";

// 別アプリ（external-api）へイベントを送るクライアント。
// 相手はこのリポジトリ内の別ワークスペースだが、DB も別・プロセスも別の
// 「外部サービス」として扱う。やり取りは HTTP + APIキーだけ。

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

export const externalApiClient = {
  /**
   * ゲーム作成イベントを送る。
   *
   * 送信に失敗した場合は例外を投げる。握りつぶすかどうかは呼び出し側が決める。
   */
  async sendGameCreated(event: GameCreatedEvent): Promise<void> {
    const response = await fetch(`${env.EXTERNAL_API_URL}/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // 相手が要求している鍵。ユーザーのトークンとは別物で、
        // 「どのアプリからの呼び出しか」を示す。
        "x-api-key": env.EXTERNAL_API_KEY,
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
