import type { FastifyReply, FastifyRequest } from "fastify";
import {
  authService,
  type ConfirmSignupInput,
  type SignupInput,
} from "../services/auth.js";
import {
  AlreadyConfirmedError,
  EmailAlreadyExistsError,
  ExpiredConfirmationCodeError,
  InvalidConfirmationCodeError,
  PasswordPolicyError,
} from "../errors.js";

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

  // TODO: Cognito でのログインは未実装。
  // InitiateAuth を使う予定だが、アプリクライアントに
  // ALLOW_USER_PASSWORD_AUTH を追加してから着手する。
  async login(_request: FastifyRequest, reply: FastifyReply) {
    return reply
      .code(501)
      .send({ error: "ログインは Cognito 移行中のため未実装です" });
  },
};
