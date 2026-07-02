import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
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
    // 1枚目がめくられ2枚目待ちの position。無ければ null（ターンの途中状態）。
    pendingFlipPosition: smallint("pending_flip_position"),
    // 全ペアが一致した時刻。null なら進行中。
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("games_size_check", sql`${table.size} in (4, 6, 8)`)],
);

// game_cards: 神経衰弱の盤面。1 ゲームにつき size*size 行。
// pairKey は (size*size)/2 種類のいずれかで、同じ pairKey が必ず2枚存在する。
// 写真アップロード導入後は pairKey を実画像 URL にマッピングする想定（今は仮の整数値）。
export const gameCards = pgTable(
  "game_cards",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    gameId: bigint("game_id", { mode: "number" })
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    pairKey: smallint("pair_key").notNull(),
    matched: boolean("matched").notNull().default(false),
  },
  (table) => [
    unique("game_cards_game_id_position_key").on(table.gameId, table.position),
    check("game_cards_position_check", sql`${table.position} >= 0`),
    check("game_cards_pair_key_check", sql`${table.pairKey} >= 0`),
  ],
);

// 今後のテーブル（例: scores）もこのファイルに追記していく
