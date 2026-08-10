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

// Cognito のパスワードポリシー違反。
// 文字種などの条件は Cognito 側（ユーザープール）で決まっているため、
// フロントの入力チェックだけでは弾ききれない。
export class PasswordPolicyError extends Error {
  constructor(
    message = "パスワードが要件を満たしていません（8文字以上で、大文字・小文字・数字・記号を含めてください）",
  ) {
    super(message);
    this.name = "PasswordPolicyError";
  }
}

// 未認証（トークンが無い・無効・アカウント不在）。
export class UnauthenticatedError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

// ゲームが存在しない、またはログイン中アカウントの所有でない。
// 「他人のゲームの有無」を漏らさないため、未所有も未存在と同じ扱いにする。
export class GameNotFoundError extends Error {
  constructor(message = "ゲームが見つかりません") {
    super(message);
    this.name = "GameNotFoundError";
  }
}
