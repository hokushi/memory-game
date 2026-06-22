// アプリ共通のドメインエラー。
// インフラ層（DB のエラーコード等）をここで定義したドメインエラーに変換し、
// 上位層（service / controller）は DB の詳細を知らずに済むようにする。

export class EmailAlreadyExistsError extends Error {
  constructor(message = "このメールアドレスは既に登録されています") {
    super(message);
    this.name = "EmailAlreadyExistsError";
  }
}

// ログイン失敗。メール不在・パスワード不一致を区別しない
// （どのメールが存在するかを攻撃者に漏らさないため）。
export class InvalidCredentialsError extends Error {
  constructor(message = "メールアドレスまたはパスワードが違います") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}
