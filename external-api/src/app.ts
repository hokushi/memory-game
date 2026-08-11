import Fastify, { type FastifyInstance } from "fastify";
import "./types/fastify.js";
import { eventRoutes } from "./routes/event.js";
import { verifyToken } from "./middleware/verifyToken.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  // ブラウザから直接叩く画面は持たないので CORS プラグインは入れない。
  // 呼び出し元はサーバー（memory-game backend）で、CORS は関係ないため。

  // --- 公開ルート（APIキー不要） ---
  app.get("/", async () => {
    return { service: "external-api", health: "/health" };
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  // --- 認証必須ルート ---
  // このスコープ内に登録したルートは、すべて verifyToken を通る。
  // onRequest（一番早いフック）で見る。preHandler だとボディの検証が先に走り、
  // 認証が通っていない相手にも「どんな項目が必要か」を 400 で教えてしまうため。
  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook("onRequest", verifyToken);

    await protectedRoutes.register(eventRoutes);
  });

  return app;
}
