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
pnpm dev:back       # バックエンド開発サーバー（http://localhost:3001）
```

## DB に持たせる想定（叩き台）

- スコア / プレイ記録（クリアまでのめくり回数・タイム）を保存し、ランキングを出す

## ローカル起動（このあと用意）

```bash
docker compose up -d   # PostgreSQL 起動
```

## ステータス

- [x] リポジトリ作成
- [x] 技術構成の決定（Next.js + Fastify / pnpm monorepo）
- [x] フロント基盤（Next.js セットアップ）
- [x] バックエンド基盤（Fastify セットアップ）
- [ ] docker-compose + 初期スキーマ
- [ ] ゲーム本体
- [ ] RDS へ展開
