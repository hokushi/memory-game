import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  // CORS の許可オリジン。
  // - CORS_ORIGIN 未設定（ローカル開発）: すべて許可
  // - CORS_ORIGIN 設定（本番）: カンマ区切りで指定したオリジンだけ許可
  //   例: CORS_ORIGIN=https://memory-game.com,https://www.memory-game.com
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : true;

  app.register(cors, {
    origin: corsOrigin,
  });

  app.get("/", async () => {
    return { service: "memory-game backend", health: "/health" };
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
