import type { FastifyReply, FastifyRequest } from "fastify";
import {
  authService,
  type ConfirmSignupInput,
  type LoginInput,
  type SignupInput,
} from "../services/auth.js";
import {
  AlreadyConfirmedError,
  EmailAlreadyExistsError,
  ExpiredConfirmationCodeError,
  InvalidConfirmationCodeError,
  InvalidCredentialsError,
  PasswordPolicyError,
  UserNotConfirmedError,
} from "../errors.js";
import { isProd } from "../config/env.js";

export const authController = {
  async signup(request: FastifyRequest, reply: FastifyReply) {
    // バリデーションはルート定義の JSON Schema 済みなので型を確定させる
    const body = request.body as SignupInput;

    try {
      const { account, confirmationRequired } = await authService.signup(body);

      // この時点ではまだ未確認でログインできないため、トークンは発行しない。
      // フロントは confirmationRequired を見て確認コード入力画面へ進む。
      return reply.code(201).send({ account, confirmationRequired });
    } catch (err) {
      if (err instanceof EmailAlreadyExistsError) {
        return reply.code(409).send({ error: err.message });
      }
      if (err instanceof PasswordPolicyError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  },

  async confirmSignup(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as ConfirmSignupInput;

    try {
      await authService.confirmSignup(body);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof InvalidConfirmationCodeError) {
        return reply.code(400).send({ error: err.message });
      }
      if (err instanceof ExpiredConfirmationCodeError) {
        return reply.code(410).send({ error: err.message });
      }
      if (err instanceof AlreadyConfirmedError) {
        return reply.code(409).send({ error: err.message });
      }
      throw err;
    }
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LoginInput;

    try {
      const { account, tokens } = await authService.login(body);

      // Cognito が発行したアクセストークンをそのまま持たせる。
      // 自前で署名し直さないので、失効の管理も Cognito 側に寄る。
      reply.setCookie("access_token", tokens.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        maxAge: tokens.expiresIn,
      });

      return reply.code(200).send({ account });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return reply.code(401).send({ error: err.message });
      }
      if (err instanceof UserNotConfirmedError) {
        return reply.code(403).send({ error: err.message });
      }
      throw err;
    }
  },
};
