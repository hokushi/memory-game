import { requireEnv } from "./loadEnv.js";

// このアプリで使う環境変数をここに集約する。
// 未設定なら起動時にエラーで落とす（フォールバックしない）。
export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  PORT: Number(requireEnv("PORT")),
  HOST: requireEnv("HOST"),
  NODE_ENV: requireEnv("NODE_ENV"),
  // このAPIを叩くのに必要な鍵。呼び出し側（memory-game backend）と共有する。
  API_KEY: requireEnv("API_KEY"),
} as const;
