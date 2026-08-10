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
// パスワードはこのテーブルに持たない。認証情報の正解は Cognito 側だけに置き、
// ここは「アプリのデータ」と「Cognito のどのユーザーか（cognitoSub）」を持つ。
// 両方にパスワードを持つと、再設定などで必ずズレて破綻する。
export const accounts = pgTable("accounts", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // Cognito がユーザーに振る一意な ID（UUID）。
  // メールは変更されうるが sub は変わらないので、紐付けはこちらで行う。
  cognitoSub: text("cognito_sub").notNull().unique(),
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

// game_photos: ゲームで使う写真（S3 に上げた実体への参照）
// 画像バイナリは S3 に置き、DB には S3 のオブジェクトキーだけを持つ。
// 並び順が要るときは id（採番順＝挿入順）で代用する。
export const gamePhotos = pgTable("game_photos", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  // 所属ゲーム。ゲーム削除時は写真レコードも削除（S3 実体の削除は別途）。
  gameId: bigint("game_id", { mode: "number" })
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  // S3 のオブジェクトキー。例: games/123/<uuid>
  s3Key: text("s3_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 今後のテーブル（例: scores）もこのファイルに追記していく
