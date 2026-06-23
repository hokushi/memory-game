import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.js";
import { accountRoutes } from "./routes/account.js";
import { authenticate } from "./middleware/authenticate.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  // CORS の許可オリジンを「本番 / ローカル」で切り替える。
  // - 本番 (NODE_ENV === "production"): CORS_ORIGIN に指定したオリジンだけ許可
  //   例: CORS_ORIGIN=https://memory-game.com,https://www.memory-game.com
  // - ローカル開発: すべて許可
  const isProd = process.env.NODE_ENV === "production";
  const corsOrigin = isProd
    ? (process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) ?? false)
    : true;

  app.register(cors, {
    origin: corsOrigin,
    // httpOnly Cookie をやり取りするため資格情報を許可する
    credentials: true,
  });

  app.register(cookie);
  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    // アクセストークンは httpOnly Cookie から読む
    cookie: { cookieName: "access_token", signed: false },
    sign: { expiresIn: "7d" },
  });

  // --- 公開ルート（認証不要） ---
  app.get("/", async () => {
    return { service: "memory-game backend", health: "/health" };
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.register(authRoutes);

  // --- 認証必須ルート ---
  // このスコープ内に登録したルートは、すべて authenticate ミドルウェアを通る。
  // 認証が必要なルート（accountRoutes など）はここに追加する。
  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", authenticate);

    await protectedRoutes.register(accountRoutes);
  });

  return app;
}
