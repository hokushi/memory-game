import type { FastifyReply, FastifyRequest } from "fastify";
import { gameService } from "../services/game.js";
import { photoService } from "../services/photo.js";

type CreateGameBody = {
  name: string;
  size: number;
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
