import type { FastifyReply, FastifyRequest } from "fastify";
import { gameService } from "../services/game.js";
import { GameNotFoundError, InvalidMoveError } from "../errors.js";

type CreateGameBody = {
  name: string;
  size: number;
};

type GameIdParams = {
  id: number;
};

type FlipBody = {
  position: number;
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
    return reply.code(200).send({ games });
  },

  async getBoard(request: FastifyRequest, reply: FastifyReply) {
    const { accountId } = request.user;
    const { id } = request.params as GameIdParams;

    try {
      const board = await gameService.getBoard(id, accountId);
      return reply.code(200).send({ board });
    } catch (err) {
      if (err instanceof GameNotFoundError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  },

  async flip(request: FastifyRequest, reply: FastifyReply) {
    const { accountId } = request.user;
    const { id } = request.params as GameIdParams;
    const { position } = request.body as FlipBody;

    try {
      const result = await gameService.flip(id, accountId, position);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof GameNotFoundError) {
        return reply.code(404).send({ error: err.message });
      }
      if (err instanceof InvalidMoveError) {
        return reply.code(409).send({ error: err.message });
      }
      throw err;
    }
  },

  async restart(request: FastifyRequest, reply: FastifyReply) {
    const { accountId } = request.user;
    const { id } = request.params as GameIdParams;

    try {
      const board = await gameService.restart(id, accountId);
      return reply.code(200).send({ board });
    } catch (err) {
      if (err instanceof GameNotFoundError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  },
};
