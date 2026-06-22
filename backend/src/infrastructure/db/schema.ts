import { bigint, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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

// 今後のテーブル（例: scores）もこのファイルに追記していく
