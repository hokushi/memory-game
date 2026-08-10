import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  GetUserCommand,
  InitiateAuthCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { env } from "../../config/env.js";

// アプリ全体で使い回す Cognito クライアント。
// 認証情報は SDK の標準クレデンシャルチェーンに任せる（s3/index.ts と同じ）。
//
// なお SignUp / ConfirmSignUp / ResendConfirmationCode は
// 「誰でも叩ける公開 API」なので IAM の権限は不要。
// AdminDeleteUser だけは管理系 API なので IAM 権限が要る。
const cognito = new CognitoIdentityProviderClient({
  region: env.AWS_REGION,
});

// Cognito が発行したアクセストークンを検証する係。
// 公開鍵（jwks.json）は初回に取りに行き、以降はキャッシュされる。
// 「署名が本物か」「有効期限内か」「このアプリ向けか」をまとめて見てくれるので、
// 検証のたびに Cognito へ問い合わせる必要はない。
export const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: env.COGNITO_CLIENT_ID,
});

export type LoginTokens = {
  accessToken: string;
  /** アクセストークンの有効秒数。Cookie の寿命をこれに合わせる。 */
  expiresIn: number;
};

export type SignUpResult = {
  /** Cognito がユーザーに振る一意な ID。DB との紐付けに使う。 */
  sub: string;
  /** 確認コードの入力が既に済んでいるか（自己登録では通常 false）。 */
  confirmed: boolean;
};

export const cognitoClient = {
  /**
   * ユーザーを作成する。同時に確認コードのメールが飛ぶ。
   * この時点ではまだ未確認（UNCONFIRMED）でログインはできない。
   */
  async signUp(email: string, password: string): Promise<SignUpResult> {
    const result = await cognito.send(
      new SignUpCommand({
        ClientId: env.COGNITO_CLIENT_ID,
        // ユーザープールを「メールでサインイン」で作ったので、
        // Username にはメールアドレスをそのまま渡す。
        Username: email,
        Password: password,
      }),
    );

    if (!result.UserSub) {
      throw new Error("Cognito から UserSub が返りませんでした");
    }

    return {
      sub: result.UserSub,
      confirmed: result.UserConfirmed ?? false,
    };
  },

  /**
   * メールに届いた確認コードを検証して本登録（CONFIRMED）にする。
   * これを通すまでアカウントはログインに使えない。
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    await cognito.send(
      new ConfirmSignUpCommand({
        ClientId: env.COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      }),
    );
  },

  /**
   * メールとパスワードで認証し、sub と Cognito のアクセストークンを返す。
   *
   * パスワードの照合はここ（Cognito）だけで行う。DB では一切照合しない。
   *
   * sub はトークンの中にも入っているが、それを取り出すには JWT を
   * 自前で解く必要があるため、GetUser で素直に問い合わせる。
   */
  async login(
    email: string,
    password: string,
  ): Promise<{ sub: string; tokens: LoginTokens }> {
    const auth = await cognito.send(
      new InitiateAuthCommand({
        ClientId: env.COGNITO_CLIENT_ID,
        // メールとパスワードをそのまま送る方式。
        // アプリクライアント側で ALLOW_USER_PASSWORD_AUTH の許可が必要。
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }),
    );

    const accessToken = auth.AuthenticationResult?.AccessToken;
    if (!accessToken) {
      // MFA などで追加の入力を求められた場合はここに来る（今は未対応）
      throw new Error(
        `想定外の認証応答です（ChallengeName: ${auth.ChallengeName ?? "なし"}）`,
      );
    }

    const user = await cognito.send(
      new GetUserCommand({ AccessToken: accessToken }),
    );
    const sub = user.UserAttributes?.find((a) => a.Name === "sub")?.Value;
    if (!sub) {
      throw new Error("Cognito のユーザー属性に sub がありません");
    }

    return {
      sub,
      tokens: {
        accessToken,
        // ExpiresIn が無いことは通常ないが、無ければ 1 時間として扱う
        expiresIn: auth.AuthenticationResult?.ExpiresIn ?? 3600,
      },
    };
  },

  /**
   * ユーザーを削除する。
   * DB への保存に失敗したときの巻き戻し用（Cognito にだけ残る状態を防ぐ）。
   */
  async deleteUser(email: string): Promise<void> {
    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID,
        Username: email,
      }),
    );
  },
};
