// アプリ共通のドメインエラー。
// インフラ層（DB のエラーコード等）をここで定義したドメインエラーに変換し、
// 上位層（service / controller）は DB の詳細を知らずに済むようにする。

export class EmailAlreadyExistsError extends Error {
  constructor(message = "このメールアドレスは既に登録されています") {
    super(message);
    this.name = "EmailAlreadyExistsError";
  }
}
