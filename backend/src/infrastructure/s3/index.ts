import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";

// アプリ全体で使い回す S3 クライアント。
// 認証情報は SDK の標準クレデンシャルチェーンに任せる:
//   ローカル  → 環境変数(AWS_ACCESS_KEY_ID 等) or ~/.aws/credentials
//   本番(ECS) → タスクロール
export const s3 = new S3Client({
  region: env.AWS_REGION,
  // 新しめの SDK は署名付き URL に既定でチェックサムヘッダを埋め込み、
  // ブラウザからの素朴な PUT が署名不一致で失敗する。必要時のみに抑える。
  requestChecksumCalculation: "WHEN_REQUIRED",
});

export const S3_BUCKET = env.S3_BUCKET;
