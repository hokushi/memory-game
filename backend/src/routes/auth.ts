import type { FastifyInstance } from "fastify";
import { authController } from "../controllers/auth.js";

// リクエストボディの検証スキーマ（Fastify 標準の JSON Schema バリデーション）
const signupBodySchema = {
  type: "object",
  required: ["name", "email", "password"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 50 },
    email: {
      type: "string",
      // 簡易メール形式チェック（厳密な検証はフロントの zod 側でも実施）
      pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
    },
    password: { type: "string", minLength: 8 },
  },
} as const;

// ログインは「形式チェック」だけ（最小文字数などの強い制約は課さない）。
const loginBodySchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
    password: { type: "string", minLength: 1 },
  },
} as const;

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/signup",
    { schema: { body: signupBodySchema } },
    authController.signup,
  );

  app.post(
    "/auth/login",
    { schema: { body: loginBodySchema } },
    authController.login,
  );
}
