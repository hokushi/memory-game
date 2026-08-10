import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { authRoutes } from "./routes/auth.js";
import { accountRoutes } from "./routes/account.js";
import { gameRoutes } from "./routes/game.js";
import { authenticate } from "./middleware/authenticate.js";
import { env, isProd } from "./config/env.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  // CORS の許可オリジンを「本番 / ローカル」で切り替える。
  // - 本番 (NODE_ENV === "production"): CORS_ORIGIN に指定したオリジンだけ許可
  //   例: CORS_ORIGIN=https://memory-game.com,https://www.memory-game.com
  // - ローカル開発: すべて許可
  const corsOrigin = isProd
    ? env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : false
    : true;

  app.register(cors, {
    origin: corsOrigin,
    // httpOnly Cookie をやり取りするため資格情報を許可する
    credentials: true,
  });

  // トークンは Cognito が発行したものをそのまま使うため、
  // 自前で署名する仕組み（@fastify/jwt）は持たない。
  // Cookie から読み出すためのプラグインだけ入れる。
  app.register(cookie);

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
    await protectedRoutes.register(gameRoutes);
  });

  return app;
}
