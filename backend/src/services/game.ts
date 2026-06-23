import { gameRepository, type Game } from "../infrastructure/repositories/game.js";

export type CreateGameInput = {
  name: string;
  size: number;
};

export const gameService = {
  async create(input: CreateGameInput): Promise<Game> {
    return gameRepository.create(input);
  },
};
