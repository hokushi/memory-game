import bcrypt from "bcryptjs";
import {
  accountRepository,
  type AccountSummary,
} from "../infrastructure/repositories/account.js";
import { EmailAlreadyExistsError } from "../errors.js";

export type SignupInput = {
  name: string;
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

    // なお、チェックと登録の間に同じメールが登録される競合に備えて、
    // repository 側でも UNIQUE 制約違反を同じエラーに変換している（保険）。
    return accountRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
  },
};
