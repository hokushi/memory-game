import Fastify, { type FastifyInstance } from "fastify";
import { eventRoutes } from "./routes/event.js";
import { requireApiKey } from "./middleware/apiKey.js";

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

  // --- APIキー必須ルート ---
  // このスコープ内に登録したルートは、すべて requireApiKey を通る。
  // onRequest（一番早いフック）で見る。preHandler だとボディの検証が先に走り、
  // 鍵が無い相手にも「どんな項目が必要か」を 400 で教えてしまうため。
  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook("onRequest", requireApiKey);

    await protectedRoutes.register(eventRoutes);
  });

  return app;
}
