import {
  bigint,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ============================================================
// external-api スキーマ
// memory-game とは別の DB（external_api）に置く。
// このアプリは「外の別サービス」という想定なので、memory-game の
// accounts / games テーブルは参照しない（外部キーも張らない）。
// 送られてきた ID はただの数値として持つ。
// ============================================================

// clients: このAPIを使う「相手のシステム」と、その公開鍵
//
// 利用登録すると 1 行できる、というイメージのテーブル。
// 公開鍵は秘密ではないので、そのまま列に持ってよい（秘密鍵は相手の手元にしかない）。
// リクエストに付いてきた JWT の iss で行を引き、その public_key で署名を検証する。
export const clients = pgTable("clients", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  // 相手が名乗る ID。JWT の iss に入ってくる値。例: cli_8f3a...
  clientId: text("client_id").notNull().unique(),
  // 人が見て分かる名前。例: memory-game
  name: text("name").notNull(),
  // PEM 形式の公開鍵（-----BEGIN PUBLIC KEY----- で始まる文字列）
  publicKey: text("public_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// events: 他サービスから送られてきたイベント
export const events = pgTable(
  "events",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // イベントの種類。今は "game.created" のみ
    type: text("type").notNull(),
    // 送信元アプリの識別子（例: "memory-game"）。
    // 将来ほかのアプリからも受けられるように持っておく。
    source: text("source").notNull(),
    // ここから下は送信元（memory-game）での ID。こちらの DB では外部キーにしない。
    gameId: bigint("game_id", { mode: "number" }).notNull(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    gameName: text("game_name").notNull(),
    size: smallint("size").notNull(),
    // 送信元でイベントが起きた時刻（＝ゲームの createdAt）
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    // こちらが受け取った時刻
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("events_received_at_idx").on(table.receivedAt)],
);
