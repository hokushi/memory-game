import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
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
