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

// 未認証（トークンが無い・無効・アカウント不在）。
export class UnauthenticatedError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

// ゲームが存在しない、または他アカウントのゲーム。
// 「存在しない」と「他人のものだから見せない」を区別しない（所有者情報を漏らさないため）。
export class GameNotFoundError extends Error {
  constructor(message = "ゲームが見つかりません") {
    super(message);
    this.name = "GameNotFoundError";
  }
}

// 不正な操作（範囲外 position、既に matched、同一 position の二重めくり、完了済みゲームへの flip）。
export class InvalidMoveError extends Error {
  constructor(message = "不正な操作です") {
    super(message);
    this.name = "InvalidMoveError";
  }
}
