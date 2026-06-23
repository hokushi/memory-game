import { gameRepository, type Game } from "../infrastructure/repositories/game.js";

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
};
