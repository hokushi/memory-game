import type { FastifyReply, FastifyRequest } from "fastify";
import { gameService } from "../services/game.js";
import { photoService } from "../services/photo.js";
import { GameNotFoundError } from "../errors.js";

type CreateGameBody = {
  name: string;
  size: number;
};

type GameParams = {
  gameId: number;
};

export const gameController = {
  async create(request: FastifyRequest, reply: FastifyReply) {
    // バリデーションはルートの JSON Schema 済み
    const body = request.body as CreateGameBody;
    // オーナーはリクエストボディではなくトークン（accountId）から決める
    const { accountId } = request.user;

    const game = await gameService.create({ accountId, ...body });
    return reply.code(201).send({ game });
  },

  async get(request: FastifyRequest, reply: FastifyReply) {
    const { gameId } = request.params as GameParams;
    const { accountId } = request.user;

    try {
      const game = await gameService.getForAccount(accountId, gameId);

      // 表示用の写真URL（署名付きGET）を付ける
      const photoUrlsByGame = await photoService.getPhotoUrlsByGameIds([
        game.id,
      ]);
      return reply.code(200).send({
        game: { ...game, photoUrls: photoUrlsByGame[game.id] ?? [] },
      });
    } catch (err) {
      if (err instanceof GameNotFoundError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  },

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { accountId } = request.user;

    const games = await gameService.listByAccount(accountId);

    // 各ゲームに表示用の写真URL（署名付きGET）を付ける
    const photoUrlsByGame = await photoService.getPhotoUrlsByGameIds(
      games.map((game) => game.id),
    );
    const gamesWithPhotos = games.map((game) => ({
      ...game,
      photoUrls: photoUrlsByGame[game.id] ?? [],
    }));

    return reply.code(200).send({ games: gamesWithPhotos });
  },
};
