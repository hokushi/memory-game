# memory-game

神経衰弱（メモリーゲーム）。めくった 2 枚のカードが揃えばペア成立、全ペアを揃えるとクリア。

学習目的: ローカルで作ったアプリの DB 構造を PostgreSQL に落とし込み、最終的に AWS RDS へ展開する流れを体験する。

## 構成

monorepo（pnpm workspace）。

- `frontend/` — Next.js（TypeScript / App Router / Tailwind CSS）
- `backend/` — Fastify（TypeScript / ESM）
- `external-api/` — **別アプリ**（画面なしの Fastify API + 専用 DB）。backend から外部API呼び出しを練習するための送り先。詳細は [external-api/README.md](external-api/README.md)
- ローカル開発は Docker の PostgreSQL を使用（AWS には触れずコスト 0）
- スキーマはマイグレーション（SQL）で管理し、同じものを後で RDS に流す

### 開発

```bash
pnpm install        # ルートで一括インストール
pnpm dev:front      # フロント開発サーバー（http://localhost:3000）
pnpm dev:back       # バックエンド開発サーバー（http://localhost:3002）
pnpm dev:ext        # 別アプリ external-api（http://localhost:3003）
```

ポートは 3000 / 3002 / 3003 で分かれており、それぞれ独立したプロセスとして起動する。

## データベース

ローカルは Docker の PostgreSQL を使う。スキーマは **Drizzle** で宣言的に管理する。
テーブルのあるべき完成形を `backend/src/db/schema.ts` の1ファイルに書き、`pnpm db:push` で差分だけ DB に当てる（既存データは消えない）。同じスキーマを後で RDS にも適用する。

```bash
docker compose up -d            # PostgreSQL 起動（localhost:5432、空のDB）※ external-api 用の DB（localhost:5433）も一緒に起動する
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

## 外部API呼び出し（external-api）

外部サービスを HTTP で呼ぶ練習用に、同じリポジトリへ独立したアプリ `external-api`（:3003、専用 DB `external_api`）を置いている。ゲーム作成時に backend からイベントを POST する。

```
POST /games (backend :3002)
  ├─ games テーブルに保存
  ├─ SES で作成通知メール
  └─ POST http://localhost:3003/events   ← 外部API呼び出し
       Authorization: Bearer <秘密鍵で署名した JWT>
       backend/src/infrastructure/externalApi/index.ts
       ▼
   external-api (:3003) → 公開鍵で検証 → events テーブル（別 DB）
```

送信は付随的な処理なので、失敗してもゲーム作成は成功する（ログに残すだけ）。

認証は**公開鍵方式**。backend が秘密鍵（`EXTERNAL_API_PRIVATE_KEY`）で署名し、external-api は `clients` テーブルに登録された公開鍵で検証する。共有の秘密（APIキー）は持たないので、external-api 側の DB が漏れてもなりすましはできない。鍵の作り方と登録手順は [external-api/README.md](external-api/README.md)。

届いたイベントは DB で確認できる。

```bash
docker exec external-api-db psql -U postgres -d external_api -c 'select * from events;'
```

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
