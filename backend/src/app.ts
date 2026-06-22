import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.js";

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
  });

  app.get("/", async () => {
    return { service: "memory-game backend", health: "/health" };
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.register(authRoutes);

  return app;
}
