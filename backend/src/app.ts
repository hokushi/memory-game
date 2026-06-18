import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  // フロント（Next.js）からのリクエストを許可。本番では origin を絞る。
  app.register(cors, {
    origin: true,
  });

  app.get("/", async () => {
    return { service: "memory-game backend", health: "/health" };
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
