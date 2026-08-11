import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { clientRepository } from "../src/infrastructure/repositories/client.js";

// 「利用登録 + 公開鍵の登録」を行う開発用スクリプト。
// 本物の外部サービスなら Web の入力欄や登録用 API が用意されている所で、
// やっていることは clients テーブルに 1 行入れるだけ。
//
// 使い方:
//   pnpm --filter external-api register-client memory-game ./public.pem

const [name, publicKeyPath] = process.argv.slice(2);

if (!name || !publicKeyPath) {
  console.error(
    "使い方: pnpm --filter external-api register-client <名前> <公開鍵のPEMファイル>",
  );
  process.exit(1);
}

const publicKey = readFileSync(publicKeyPath, "utf8").trim();

if (!publicKey.startsWith("-----BEGIN PUBLIC KEY-----")) {
  // 秘密鍵（BEGIN PRIVATE KEY）を間違って渡していないかの確認も兼ねる
  console.error(
    "公開鍵の PEM ではありません。-----BEGIN PUBLIC KEY----- で始まるファイルを指定してください",
  );
  process.exit(1);
}

// 相手が名乗る ID。推測されても困らないが、一意にするためランダムにする。
const clientId = `cli_${randomBytes(8).toString("hex")}`;

const client = await clientRepository.create({ clientId, name, publicKey });

console.log("登録しました。呼び出し側の JWT の iss にこの client_id を入れてください。");
console.log(`  client_id: ${client.clientId}`);
console.log(`  name     : ${client.name}`);

// postgres の接続が開いたままだとプロセスが終わらないので明示的に終了する
process.exit(0);
