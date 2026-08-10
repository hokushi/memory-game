import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { accounts } from "../db/schema.js";

export type NewAccount = {
  name: string;
  email: string;
  cognitoSub: string;
};

export type AccountSummary = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

// 純粋なデータアクセスのみ。業務ルールは service 層に置く。
export const accountRepository = {
  // id でアカウントを探す（無ければ undefined）
  async findById(id: number): Promise<AccountSummary | undefined> {
    const [account] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    return account;
  },

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

  // Cognito の sub でアカウントを探す（無ければ undefined）。
  // ログイン時は Cognito で認証してから、返ってきた sub でこれを引く。
  async findByCognitoSub(
    cognitoSub: string,
  ): Promise<AccountSummary | undefined> {
    const [account] = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .where(eq(accounts.cognitoSub, cognitoSub))
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
