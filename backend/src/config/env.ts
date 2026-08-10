import { requireEnv } from "./loadEnv.js";

// アプリ全体で使う環境変数をここに集約する。
// 各所で process.env.X ?? "default" と書かず、env.X を参照する。
// フォールバックはせず、未設定なら起動時にエラーで落とす。
export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  PORT: Number(requireEnv("PORT")),
  HOST: requireEnv("HOST"),
  NODE_ENV: requireEnv("NODE_ENV"),
  // 本番(NODE_ENV=production)のときだけ CORS で使う。未設定なら undefined。
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  // 写真アップロード先の S3。リージョンとバケット名は必須。
  // 認証情報(アクセスキー / ECS タスクロール等)は AWS SDK の標準の
  // クレデンシャルチェーンが自動で解決するため、ここでは扱わない。
  AWS_REGION: requireEnv("AWS_REGION"),
  S3_BUCKET: requireEnv("S3_BUCKET"),
  // 通知メールの送信元。SES で検証済みのアドレスでないと送信が弾かれる。
  SES_FROM_ADDRESS: requireEnv("SES_FROM_ADDRESS"),
  // Cognito（ユーザーとパスワードの置き場）。
  // どちらも秘密の値ではないが、環境ごとに変わるのでコードに直書きしない。
  COGNITO_USER_POOL_ID: requireEnv("COGNITO_USER_POOL_ID"),
  COGNITO_CLIENT_ID: requireEnv("COGNITO_CLIENT_ID"),
} as const;

export const isProd = env.NODE_ENV === "production";
