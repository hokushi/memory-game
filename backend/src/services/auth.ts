import {
  accountRepository,
  type AccountSummary,
} from "../infrastructure/repositories/account.js";
import { cognitoClient } from "../infrastructure/cognito/index.js";
import { EmailAlreadyExistsError, PasswordPolicyError } from "../errors.js";

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type SignupResult = {
  account: AccountSummary;
  confirmationRequired: boolean;
};

/** AWS SDK のエラーは name に例外名が入る（例: UsernameExistsException）。 */
function cognitoErrorName(err: unknown): string | undefined {
  return err instanceof Error ? err.name : undefined;
}

export const authService = {
  /**
   * アカウントを作成する。
   *
   * Cognito と DB の 2 箇所に書き込むため、必ず Cognito を先にする。
   * 逆順だと「DB にはいるが Cognito にいない = 永久にログインできない幽霊
   * アカウント」ができてしまい、そちらの方が復旧しづらい。
   */
  async signup(input: SignupInput): Promise<SignupResult> {
    // 業務ルール: 同じメールアドレスは登録できない。
    // Cognito 側でも弾かれるが、先に見ておくと分かりやすいエラーを返せる。
    const existing = await accountRepository.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyExistsError();
    }

    // Cognito にユーザーを作る（同時に確認コードのメールが飛ぶ）
    let signUpResult;
    try {
      signUpResult = await cognitoClient.signUp(input.email, input.password);
    } catch (err) {
      switch (cognitoErrorName(err)) {
        case "UsernameExistsException":
          throw new EmailAlreadyExistsError();
        case "InvalidPasswordException":
          throw new PasswordPolicyError();
        default:
          throw err;
      }
    }

    // DB にアプリ側のデータを保存する
    try {
      const account = await accountRepository.create({
        name: input.name,
        email: input.email,
        cognitoSub: signUpResult.sub,
      });

      return {
        account,
        confirmationRequired: !signUpResult.confirmed,
      };
    } catch (err) {
      // DB が失敗したら Cognito 側を消して巻き戻す。
      // 巻き戻しにも失敗した場合は、元のエラーを潰さないよう握って進む
      try {
        await cognitoClient.deleteUser(input.email);
      } catch (rollbackErr) {
        console.error(
          `[signup] Cognito の巻き戻しに失敗しました。手動で削除してください: ${input.email}`,
          rollbackErr,
        );
      }
      throw err;
    }
  },
};
