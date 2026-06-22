import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { accounts } from "../db/schema.js";

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

type SignupBody = {
  name: string;
  email: string;
  password: string;
};

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/signup",
    { schema: { body: signupBodySchema } },
    async (request, reply) => {
      const { name, email, password } = request.body as SignupBody;

      // パスワードは平文で保存しない。bcrypt でハッシュ化して保存する。
      const passwordHash = await bcrypt.hash(password, 10);

      try {
        const [account] = await db
          .insert(accounts)
          .values({ name, email, passwordHash })
          .returning({
            id: accounts.id,
            name: accounts.name,
            email: accounts.email,
            createdAt: accounts.createdAt,
          });

        return reply.code(201).send({ account });
      } catch (err) {
        // email の UNIQUE 制約違反（PostgreSQL: 23505）。
        // Drizzle は元のエラーを cause にラップするため、両方を確認する。
        const code =
          (err as { code?: string }).code ??
          (err as { cause?: { code?: string } }).cause?.code;
        if (code === "23505") {
          return reply
            .code(409)
            .send({ error: "このメールアドレスは既に登録されています" });
        }
        throw err;
      }
    },
  );
}
