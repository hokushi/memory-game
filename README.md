# memory-game

神経衰弱（メモリーゲーム）。めくった 2 枚のカードが揃えばペア成立、全ペアを揃えるとクリア。

学習目的: ローカルで作ったアプリの DB 構造を PostgreSQL に落とし込み、最終的に AWS RDS へ展開する流れを体験する。

## 構成

monorepo（pnpm workspace）。

- `frontend/` — Next.js（TypeScript / App Router / Tailwind CSS）
- `backend/` — Fastify（TypeScript / ESM）
- ローカル開発は Docker の PostgreSQL を使用（AWS には触れずコスト 0）
- スキーマはマイグレーション（SQL）で管理し、同じものを後で RDS に流す

### 開発

```bash
pnpm install        # ルートで一括インストール
pnpm dev:front      # フロント開発サーバー（http://localhost:3000）
pnpm dev:back       # バックエンド開発サーバー（http://localhost:3002）
```

## データベース

ローカルは Docker の PostgreSQL を使う。スキーマは **Drizzle** で宣言的に管理する。
テーブルのあるべき完成形を `backend/src/db/schema.ts` の1ファイルに書き、`pnpm db:push` で差分だけ DB に当てる（既存データは消えない）。同じスキーマを後で RDS にも適用する。

```bash
docker compose up -d            # PostgreSQL 起動（localhost:5432、空のDB）
pnpm --filter backend db:push   # schema.ts の内容を DB に反映（初回はテーブル作成）
docker compose down             # 停止（データは残る）
docker compose down -v          # 停止 + データ削除（まっさらに作り直したいとき）
```

- 接続情報（既定）: `postgres://postgres:postgres@localhost:5432/memory_game`
- スキーマを変えたいときは `schema.ts` を編集して再度 `db:push`。**差分だけ当たるのでデータは保持される。**
- DB の中身を GUI で見たいときは `pnpm --filter backend db:studio`（Drizzle Studio）。

#### pgAdmin で見る

`docker compose up -d` で pgAdmin も一緒に起動する。

1. http://localhost:8080 を開く（ログイン: `admin@example.com` / `admin`）
2. 左ツリーの `memory-game` サーバー（自動登録済み）をクリック → DB パスワード `postgres` を入力
3. `memory-game` → Schemas → public → Tables → `accounts`

※ いずれもローカル開発用の値。

### テーブル（`backend/src/db/schema.ts`）

- `accounts` … アカウント（`name` / `email`(unique) / `passwordHash`）。
  パスワードは平文では保存せず、登録 API でハッシュ化した値を `passwordHash` に入れる。

### 持たせる想定（叩き台）

- スコア / プレイ記録（クリアまでのめくり回数・タイム）を保存し、ランキングを出す

## ステータス

- [x] リポジトリ作成
- [x] 技術構成の決定（Next.js + Fastify / pnpm monorepo）
- [x] フロント基盤（Next.js セットアップ）
- [x] バックエンド基盤（Fastify セットアップ）
- [x] docker-compose + DB スキーマ（Drizzle / accounts テーブル）
- [ ] 登録 / ログイン API（DB 接続）
- [ ] ゲーム本体
- [ ] RDS へ展開
