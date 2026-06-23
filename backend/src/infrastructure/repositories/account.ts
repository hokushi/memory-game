import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { accounts } from "../db/schema.js";

export type NewAccount = {
  name: string;
  email: string;
  passwordHash: string;
};

export type AccountSummary = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

// パスワード照合用にハッシュも含めて取得する型
export type AccountWithPassword = AccountSummary & {
  passwordHash: string;
};

// 純粋なデータアクセスのみ。業務ルールは service 層に置く。
export const accountRepository = {
  // メールでアカウントを探す（無ければ undefined）
  async findByEmail(email: string): Promise<AccountSummary | undefined> {
    const [account] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);

    return account;
  },

  // ログインのパスワード照合用。passwordHash も含めて取得する。
  async findByEmailWithPassword(
    email: string,
  ): Promise<AccountWithPassword | undefined> {
    const [account] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        createdAt: accounts.createdAt,
        passwordHash: accounts.passwordHash,
      })
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);

    return account;
  },

  async create(data: NewAccount): Promise<AccountSummary> {
    const [account] = await db
      .insert(accounts)
      .values(data)
      .returning({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        createdAt: accounts.createdAt,
      });

    if (!account) {
      throw new Error("アカウントの作成に失敗しました");
    }
    return account;
  },
};
