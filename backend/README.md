# backend

API サーバー（**Fastify** / TypeScript）。

神経衰弱のスコア・プレイ記録を PostgreSQL に保存し、ランキング API を提供する（予定）。

## 構成

- Fastify 5 + TypeScript（ESM / NodeNext）
- 開発実行: `tsx`（ホットリロード）
- ビルド: `tsc` → `dist/`
- CORS: `@fastify/cors`（開発中は全 origin 許可）

```
backend/
├── src/
│   ├── app.ts      # Fastify インスタンスの組み立て（ルート登録）
│   └── server.ts   # 起動エントリ（listen）
├── tsconfig.json
└── .env.example
```

## 開発

```bash
cp .env.example .env   # 必要なら編集
pnpm dev:back          # 開発サーバー（既定 http://localhost:3002）
```

ルートからのスクリプト: `pnpm dev:back` / `pnpm build:back` / `pnpm start:back`。

## エンドポイント

- `GET /health` … ヘルスチェック（`{ "status": "ok" }`）
- `POST /auth/signup` … アカウント登録
  - body: `{ "name": string, "email": string, "password": string(8文字以上) }`
  - 成功: `201` `{ "account": { id, name, email, createdAt } }`（password は返さない）
  - メール重複: `409` / バリデーション違反: `400`
  - パスワードは bcrypt でハッシュ化して `password_hash` に保存

## 環境変数

| 変数 | 既定値 | 説明 |
| --- | --- | --- |
| `PORT` | `3002` | 待ち受けポート |
| `HOST` | `0.0.0.0` | 待ち受けホスト |
