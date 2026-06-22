import bcrypt from "bcryptjs";
import {
  accountRepository,
  type AccountSummary,
} from "../infrastructure/repositories/account.js";
import { EmailAlreadyExistsError, InvalidCredentialsError } from "../errors.js";

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export const authService = {
  async signup(input: SignupInput): Promise<AccountSummary> {
    // 業務ルール: 同じメールアドレスは登録できない。
    // まず明示的に存在チェックする（重複なら分かりやすくエラー）。
    const existing = await accountRepository.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyExistsError();
    }

    // パスワードは平文で保存しない。bcrypt でハッシュ化する。
    const passwordHash = await bcrypt.hash(input.password, 10);

    return accountRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
  },

  async login(input: LoginInput): Promise<AccountSummary> {
    const account = await accountRepository.findByEmailWithPassword(
      input.email,
    );

    // メール不在・パスワード不一致は同じエラーにする
    if (!account) {
      throw new InvalidCredentialsError();
    }

    const ok = await bcrypt.compare(input.password, account.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    // パスワードハッシュは返さない
    const { passwordHash: _passwordHash, ...summary } = account;
    return summary;
  },
};
