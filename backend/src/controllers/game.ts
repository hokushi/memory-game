import type { FastifyReply, FastifyRequest } from "fastify";
import { gameService, type CreateGameInput } from "../services/game.js";

export const gameController = {
  async create(request: FastifyRequest, reply: FastifyReply) {
    // バリデーションはルートの JSON Schema 済み
    const body = request.body as CreateGameInput;

    const game = await gameService.create(body);
    return reply.code(201).send({ game });
  },
};
