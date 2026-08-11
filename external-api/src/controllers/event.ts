import type { FastifyReply, FastifyRequest } from "fastify";
import { eventRepository } from "../infrastructure/repositories/event.js";

// memory-game backend から送られてくるボディ
type CreateEventBody = {
  type: string;
  source: string;
  gameId: number;
  accountId: number;
  gameName: string;
  size: number;
  occurredAt: string;
};

type ListEventsQuery = {
  limit: number;
};

// 保存するだけで業務ロジックが無いので、memory-game 側と違って
// service 層は作らず controller からそのまま repository を呼ぶ。
export const eventController = {
  async create(request: FastifyRequest, reply: FastifyReply) {
    // バリデーションはルートの JSON Schema 済み
    const body = request.body as CreateEventBody;

    const event = await eventRepository.create({
      ...body,
      // JSON には日時型が無いので、文字列(ISO 8601)で受け取って Date に戻す
      occurredAt: new Date(body.occurredAt),
    });

    return reply.code(201).send({ event });
  },

  // 届いたイベントの確認用（ブラウザや curl で覗く）
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { limit } = request.query as ListEventsQuery;

    const events = await eventRepository.findLatest(limit);

    return reply.code(200).send({ events });
  },
};
