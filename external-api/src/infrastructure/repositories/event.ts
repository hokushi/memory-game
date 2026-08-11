import { desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { events } from "../db/schema.js";

export type NewEvent = {
  type: string;
  source: string;
  gameId: number;
  accountId: number;
  gameName: string;
  size: number;
  occurredAt: Date;
};

export type Event = NewEvent & {
  id: number;
  receivedAt: Date;
};

// 純粋なデータアクセスのみ。
export const eventRepository = {
  async create(data: NewEvent): Promise<Event> {
    const [event] = await db.insert(events).values(data).returning();

    if (!event) {
      throw new Error("イベントの保存に失敗しました");
    }
    return event;
  },

  // 受信が新しい順に取得する（動作確認用）
  async findLatest(limit: number): Promise<Event[]> {
    return db
      .select()
      .from(events)
      .orderBy(desc(events.receivedAt))
      .limit(limit);
  },
};
