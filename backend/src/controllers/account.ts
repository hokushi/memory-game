import type { FastifyReply, FastifyRequest } from "fastify";
import { accountService } from "../services/account.js";
import { UnauthenticatedError } from "../errors.js";

export const accountController = {
  async me(request: FastifyRequest, reply: FastifyReply) {
    // authenticate preHandler で検証済み。JWT から accountId を取り出す。
    const { accountId } = request.user;

    try {
      const account = await accountService.getById(accountId);
      return reply.code(200).send({ account });
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        return reply.code(401).send({ error: err.message });
      }
      throw err;
    }
  },
};
