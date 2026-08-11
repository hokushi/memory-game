# external-api

memory-game から見た **外部API** の練習用アプリ。画面は持たず、HTTP でイベントを受け取って自分の DB に保存するだけ。

同じリポジトリに置いてあるが、**別プロセス・別ポート・別 DB** の独立したアプリとして扱う。memory-game のテーブルは参照しないし、外部キーも張らない（送られてきた ID はただの数値として持つ）。

| | memory-game backend | external-api |
| --- | --- | --- |
| ポート | 3002 | **3003** |
| DB | `memory_game`（localhost:5432） | `external_api`（localhost:**5433**） |
| 認証 | Cognito のトークン（ユーザー） | 公開鍵で署名を検証（呼び出し元システム） |

## 流れ

```
フロント (3000)
   │ POST /games
   ▼
memory-game backend (3002)
   ├─ games テーブルに保存
   ├─ SES で作成通知メール
   └─ POST http://localhost:3003/events        ← ここが「外部APIを叩く」部分
        Authorization: Bearer <秘密鍵で署名した JWT>
        （backend/src/infrastructure/externalApi/index.ts）
        ▼
   external-api (3003) → clients の公開鍵で検証 → events テーブル（external_api DB）
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

## 認証（公開鍵方式）

`/` と `/health` 以外は `Authorization: Bearer <JWT>` が必要。JWT は呼び出し側が**秘密鍵で署名**し、こちらは `clients` テーブルの**公開鍵で検証**する。

このAPIは共有の秘密（APIキー）を持たない。持っているのは公開鍵だけなので、**この DB が漏れても第三者はなりすませない**（公開鍵では検証しかできず、署名は作れない）。

### しくみ

秘密鍵は**呼び出す側**が自分で作り、**公開鍵だけ**をこちらに登録する。こちらが持つのは公開鍵だけなので、この DB が漏れても第三者はなりすませない（公開鍵では検証しかできない）。

```
clients テーブル
 client_id            | name        | public_key
 cli_7496fd71abacee6f | memory-game | -----BEGIN PUBLIC KEY-----...
```

リクエストが来たときの流れ（[src/middleware/verifyToken.ts](src/middleware/verifyToken.ts)）:

1. `Authorization: Bearer` から JWT を取り出す
2. **署名を検証せずに** `iss` だけ読む … どの公開鍵を引くかを知るためだけ。中身はまだ信用しない
3. その `iss` で `clients` を引き、`public_key` を得る
4. その公開鍵で「署名・有効期限(`exp`)・宛先(`aud`)・名乗り(`iss`)」をまとめて検証する

受け入れる署名方式は `EdDSA` に固定している。トークンに書いてある `alg` を信じる実装にすると、`alg: none` や共通鍵方式にすり替えて検証をすり抜ける攻撃が通ってしまうため。

### 利用登録（＝公開鍵の登録）

呼び出す側で鍵ペアを作り、公開鍵だけを登録する。

```bash
# 呼び出す側の作業（秘密鍵は手元から出さない）
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# external-api 側に登録する（clients テーブルに 1 行入るだけ）
pnpm --filter external-api register-client memory-game ./public.pem
# → client_id: cli_xxxxxxxx  … 呼び出し側は JWT の iss にこの値を入れる
```

本物の外部サービスなら Web の入力欄や登録用 API が用意されている所で、やっていることは同じ。

## API

`Authorization: Bearer <JWT>` を付ける。curl で試すときは、登録した秘密鍵で署名したトークンが要る。

### POST /events — イベントを受け取る

```bash
curl -X POST http://localhost:3003/events \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
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

→ `201` `{ "event": { ... } }`。署名が偽物・期限切れ・宛先違い・未登録なら `401`、ボディが不正なら `400`。

### GET /events — 届いたイベントを見る（確認用）

```bash
curl -H "Authorization: Bearer $TOKEN" 'http://localhost:3003/events?limit=5'
```

トークンを用意せずに中身だけ見たいときは DB を直接覗くのが早い。

```bash
docker exec external-api-db psql -U postgres -d external_api -c 'select * from events;'
```

## 中身

memory-game backend と同じ構成（Fastify / TypeScript / Drizzle）。ただし保存するだけで業務ロジックが無いので `services/` は作らず、controller から repository を直接呼んでいる。

- `src/app.ts` … ルート登録。認証必須のスコープをここで分ける
- `src/middleware/verifyToken.ts` … 公開鍵での JWT 検証
- `src/routes/event.ts` … URL と入力チェック（JSON Schema）
- `src/controllers/event.ts` … リクエスト/レスポンスの詰め替え
- `src/infrastructure/db/schema.ts` … `clients` / `events` テーブル
- `src/infrastructure/repositories/` … DB アクセス（client / event）
- `scripts/register-client.ts` … 利用登録（公開鍵を `clients` に入れる）

DB の中身は `pnpm --filter external-api db:studio` でも見られる。
