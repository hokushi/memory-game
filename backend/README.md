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
- `POST /auth/login` … ログイン（資格情報の照合）
  - body: `{ "email": string, "password": string }`
  - 成功: `200` `{ "account": { id, name, email, createdAt } }`
  - **アクセストークン（JWT、`accountId` を含む）を httpOnly Cookie `access_token` で発行**（有効期限 7日）
  - メール不在・パスワード不一致: ともに `401`（同一メッセージで区別しない）
- `GET /account/me` … ログイン中のアカウント情報（要認証）
  - Cookie の JWT を検証し、`accountId` からアカウントを返す
  - 成功: `200` `{ "account": { id, name, email, createdAt } }`
  - トークン無し・無効: `401`

## 認証

- ログインで JWT を httpOnly Cookie（`access_token`）に保存し、以降は毎リクエストの Cookie から検証する。
- 保護ルートは `app.authenticate`（preHandler）で `request.jwtVerify()` を実行。

## 環境変数

| 変数 | 既定値 | 説明 |
| --- | --- | --- |
| `PORT` | `3002` | 待ち受けポート |
| `HOST` | `0.0.0.0` | 待ち受けホスト |
| `JWT_SECRET` | `dev-secret-change-me` | JWT 署名鍵（本番は必ず変更）|
