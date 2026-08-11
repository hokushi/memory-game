# external-api

memory-game から見た **外部API** の練習用アプリ。画面は持たず、HTTP でイベントを受け取って自分の DB に保存するだけ。

同じリポジトリに置いてあるが、**別プロセス・別ポート・別 DB** の独立したアプリとして扱う。memory-game のテーブルは参照しないし、外部キーも張らない（送られてきた ID はただの数値として持つ）。

| | memory-game backend | external-api |
| --- | --- | --- |
| ポート | 3002 | **3003** |
| DB | `memory_game`（localhost:5432） | `external_api`（localhost:**5433**） |
| 認証 | Cognito のトークン（ユーザー） | APIキー（呼び出し元アプリ） |

## 流れ

```
フロント (3000)
   │ POST /games
   ▼
memory-game backend (3002)
   ├─ games テーブルに保存
   ├─ SES で作成通知メール
   └─ POST http://localhost:3003/events   ← ここが「外部APIを叩く」部分
        x-api-key: local-dev-key            backend/src/infrastructure/externalApi/index.ts
        ▼
   external-api (3003) → events テーブル（external_api DB）
```

イベント送信は付随的な処理なので、**失敗してもゲーム作成は成功する**（ログに残すだけ）。外部サービスが落ちていても自分のサービスは止めない、という作りにしている。

## 起動

```bash
docker compose up -d              # external-db(5433) と external-api(3003) も一緒に起動する
curl http://localhost:3003/health # {"status":"ok"}
```

ホストで直接動かす場合（ホットリロードしながら中を追いたいとき）:

```bash
cp external-api/.env.example external-api/.env.local   # 初回のみ
pnpm --filter external-api db:push                     # スキーマを DB に反映
pnpm dev:ext                                           # http://localhost:3003
```

※ docker の `external-api` コンテナも 3003 を使うので、ホストで動かすときは
`docker compose stop external-api` で止めてから起動する。

## API

APIキーは `x-api-key` ヘッダーで渡す（`/` と `/health` 以外は必須）。

### POST /events — イベントを受け取る

```bash
curl -X POST http://localhost:3003/events \
  -H 'content-type: application/json' \
  -H 'x-api-key: local-dev-key' \
  -d '{
    "type": "game.created",
    "source": "memory-game",
    "gameId": 1,
    "accountId": 1,
    "gameName": "テスト",
    "size": 4,
    "occurredAt": "2026-08-11T10:00:00.000Z"
  }'
```

→ `201` `{ "event": { ... } }`。キーが違えば `401`、ボディが不正なら `400`。

### GET /events — 届いたイベントを見る（確認用）

```bash
curl -H 'x-api-key: local-dev-key' 'http://localhost:3003/events?limit=5'
```

## 中身

memory-game backend と同じ構成（Fastify / TypeScript / Drizzle）。ただし保存するだけで業務ロジックが無いので `services/` は作らず、controller から repository を直接呼んでいる。

- `src/app.ts` … ルート登録。APIキー必須のスコープをここで分ける
- `src/middleware/apiKey.ts` … `x-api-key` の確認
- `src/routes/event.ts` … URL と入力チェック（JSON Schema）
- `src/controllers/event.ts` … リクエスト/レスポンスの詰め替え
- `src/infrastructure/db/schema.ts` … `events` テーブル
- `src/infrastructure/repositories/event.ts` … DB アクセス

DB の中身は `pnpm --filter external-api db:studio` でも見られる。
