import { gameRepository, type Game } from "../infrastructure/repositories/game.js";
import { accountRepository } from "../infrastructure/repositories/account.js";
import { sesClient } from "../infrastructure/ses/index.js";
import { externalApiClient } from "../infrastructure/externalApi/index.js";
import { GameNotFoundError } from "../errors.js";

export type CreateGameInput = {
  accountId: number;
  name: string;
  size: number;
};

export const gameService = {
  async create(input: CreateGameInput): Promise<Game> {
    const game = await gameRepository.create(input);

    // 作成した本人に通知を送る。
    // これは付随的な処理なので、失敗してもゲーム作成は成功のままにする。
    // メールが送れなかっただけでゲームが作れないのは筋が悪いため。
    await notifyGameCreated(input.accountId, game);

    // 別アプリ（external-api）にも作成イベントを送る。メールと同じく付随的な処理。
    await sendGameCreatedEvent(input.accountId, game);

    return game;
  },

  // ログイン中アカウントのゲーム一覧
  async listByAccount(accountId: number): Promise<Game[]> {
    return gameRepository.findByAccountId(accountId);
  },

  // ログイン中アカウントが所有する1件のゲームを取得する。
  // 存在しない・他人のものなら GameNotFoundError。
  async getForAccount(accountId: number, gameId: number): Promise<Game> {
    const game = await gameRepository.findByIdAndAccount(gameId, accountId);
    if (!game) {
      throw new GameNotFoundError();
    }
    return game;
  },
};

/**
 * ゲーム作成を作成者本人にメールで知らせる。
 *
 * 宛先はトークンではなく DB のアカウントから引く。
 * 例外は投げず、失敗した場合はログに残すだけにする。
 */
async function notifyGameCreated(accountId: number, game: Game): Promise<void> {
  try {
    const account = await accountRepository.findById(accountId);
    if (!account) {
      // 直前に作成できている以上あり得ないが、握って進む
      console.error(`[game] 通知先のアカウントが見つかりません: ${accountId}`);
      return;
    }

    await sesClient.send({
      to: account.email,
      subject: `ゲーム「${game.name}」を作成しました`,
      body: [
        `${account.name} さん`,
        "",
        "新しいゲームを作成しました。",
        "",
        `  ゲーム名: ${game.name}`,
        `  盤面    : ${game.size} × ${game.size}`,
        "",
        "写真を登録すると遊べるようになります。",
      ].join("\n"),
    });
  } catch (err) {
    // SES がサンドボックスの場合、宛先が未検証だとここで MessageRejected になる
    console.error(`[game] 作成通知メールの送信に失敗しました: ${err}`);
  }
}

/**
 * ゲーム作成を別アプリ（external-api）に知らせる。
 *
 * 相手は別プロセス・別 DB の外部サービスなので、落ちていることも遅いこともある。
 * 例外は投げず、失敗した場合はログに残すだけにする
 * （送れなかっただけでゲーム作成まで失敗させない）。
 */
async function sendGameCreatedEvent(
  accountId: number,
  game: Game,
): Promise<void> {
  try {
    await externalApiClient.sendGameCreated({
      gameId: game.id,
      accountId,
      gameName: game.name,
      size: game.size,
      occurredAt: game.createdAt,
    });
  } catch (err) {
    // 相手が起動していない（ECONNREFUSED）／タイムアウト（TimeoutError）など
    console.error(`[game] 作成イベントの送信に失敗しました: ${err}`);
  }
}
