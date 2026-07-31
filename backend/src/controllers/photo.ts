import type { FastifyReply, FastifyRequest } from "fastify";
import { photoService, type PhotoUploadRequest } from "../services/photo.js";
import { GameNotFoundError } from "../errors.js";

type GameParams = { gameId: number };
type PresignBody = { files: PhotoUploadRequest[] };
type SaveBody = { keys: string[] };

export const photoController = {
  // 写真アップロード用の署名付き URL を発行する
  async presign(request: FastifyRequest, reply: FastifyReply) {
    const { gameId } = request.params as GameParams;
    const { files } = request.body as PresignBody;
    const { accountId } = request.user;

    try {
      const uploads = await photoService.createUploadUrls(
        accountId,
        gameId,
        files,
      );
      return reply.code(200).send({ uploads });
    } catch (err) {
      if (err instanceof GameNotFoundError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  },

  // アップロード済みのキーをゲームの写真として保存する
  async save(request: FastifyRequest, reply: FastifyReply) {
    const { gameId } = request.params as GameParams;
    const { keys } = request.body as SaveBody;
    const { accountId } = request.user;

    try {
      const photos = await photoService.savePhotos(accountId, gameId, keys);
      return reply.code(201).send({ photos });
    } catch (err) {
      if (err instanceof GameNotFoundError) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  },
};
