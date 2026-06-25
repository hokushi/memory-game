import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ============================================================
// memory-game スキーマ（あるべき完成形をここに宣言する）
// ここを書き換えて `pnpm db:push` すると、ツールが差分を計算して
// DB に当てる（既存データは消えない）。
// ============================================================

// accounts: ユーザーアカウント
// パスワードは平文では保存せず、ハッシュ化した値を passwordHash に入れる。
export const accounts = pgTable("accounts", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// games: 神経衰弱のゲーム
// size はボードの一辺（4 / 6 / 8 のみ。4×4・6×6・8×8 を表す）。
export const games = pgTable(
  "games",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // オーナー（作成したアカウント）。アカウント削除時はゲームも削除。
    accountId: bigint("account_id", { mode: "number" })
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    size: smallint("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("games_size_check", sql`${table.size} in (4, 6, 8)`)],
);

// 今後のテーブル（例: scores）もこのファイルに追記していく
