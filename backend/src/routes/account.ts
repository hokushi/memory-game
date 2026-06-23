import type { FastifyInstance } from "fastify";
import { accountController } from "../controllers/account.js";

export async function accountRoutes(app: FastifyInstance) {
  // 認証は呼び出し側のスコープ（app.ts の認証必須スコープ）で適用される
  app.get("/account/me", accountController.me);
}
