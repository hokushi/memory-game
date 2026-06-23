import type { FastifyReply, FastifyRequest } from "fastify";
import {
  authService,
  type LoginInput,
  type SignupInput,
} from "../services/auth.js";
import { EmailAlreadyExistsError, InvalidCredentialsError } from "../errors.js";

export const authController = {
  async signup(request: FastifyRequest, reply: FastifyReply) {
    // バリデーションはルート定義の JSON Schema 済みなので型を確定させる
    const body = request.body as SignupInput;

    try {
      const account = await authService.signup(body);
      return reply.code(201).send({ account });
    } catch (err) {
      if (err instanceof EmailAlreadyExistsError) {
        return reply.code(409).send({ error: err.message });
      }
      throw err;
    }
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LoginInput;

    try {
      const account = await authService.login(body);
      return reply.code(200).send({ account });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return reply.code(401).send({ error: err.message });
      }
      throw err;
    }
  },
};
