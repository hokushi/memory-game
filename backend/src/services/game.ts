import { gameRepository, type Game } from "../infrastructure/repositories/game.js";
import { GameNotFoundError } from "../errors.js";

export type CreateGameInput = {
  accountId: number;
  name: string;
  size: number;
};

export const gameService = {
  async create(input: CreateGameInput): Promise<Game> {
    return gameRepository.create(input);
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
