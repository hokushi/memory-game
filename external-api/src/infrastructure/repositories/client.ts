import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { clients } from "../db/schema.js";

export type Client = {
  clientId: string;
  name: string;
  publicKey: string;
};

// 純粋なデータアクセスのみ。
export const clientRepository = {
  // JWT の iss で利用者を引く（無ければ undefined）
  async findByClientId(clientId: string): Promise<Client | undefined> {
    const [client] = await db
      .select({
        clientId: clients.clientId,
        name: clients.name,
        publicKey: clients.publicKey,
      })
      .from(clients)
      .where(eq(clients.clientId, clientId))
      .limit(1);
    return client;
  },

  // 利用登録（開発用スクリプトから呼ぶ）
  async create(data: Client): Promise<Client> {
    const [client] = await db.insert(clients).values(data).returning({
      clientId: clients.clientId,
      name: clients.name,
      publicKey: clients.publicKey,
    });

    if (!client) {
      throw new Error("利用者の登録に失敗しました");
    }
    return client;
  },
};
