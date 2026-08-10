import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { env } from "../../config/env.js";

// アプリ全体で使い回す SES クライアント。
// 認証情報は SDK の標準クレデンシャルチェーンに任せる:
//   ローカル  → 環境変数(AWS_ACCESS_KEY_ID 等) or ~/.aws/credentials
//   本番(ECS) → タスクロール
const ses = new SESv2Client({ region: env.AWS_REGION });

export type SendMailInput = {
  to: string;
  subject: string;
  body: string;
};

export const sesClient = {
  /**
   * メールを 1 通送る。
   *
   * 送信元は SES で検証済みのアドレスである必要がある。
   * さらに SES がサンドボックスの間は、宛先も検証済みでなければ弾かれる
   * （MessageRejected が返る）。
   */
  async send(input: SendMailInput): Promise<void> {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: env.SES_FROM_ADDRESS,
        Destination: { ToAddresses: [input.to] },
        Content: {
          Simple: {
            Subject: { Data: input.subject, Charset: "UTF-8" },
            Body: { Text: { Data: input.body, Charset: "UTF-8" } },
          },
        },
      }),
    );
  },
};
