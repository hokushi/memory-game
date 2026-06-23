import {
  accountRepository,
  type AccountSummary,
} from "../infrastructure/repositories/account.js";
import { UnauthenticatedError } from "../errors.js";

export const accountService = {
  // トークンの accountId からアカウント情報を取得する
  async getById(id: number): Promise<AccountSummary> {
    const account = await accountRepository.findById(id);
    if (!account) {
      // トークンは有効だがアカウントが存在しない（削除済み等）
      throw new UnauthenticatedError();
    }
    return account;
  },
};
