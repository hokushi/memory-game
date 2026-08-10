import "fastify";
// reply.setCookie / request.cookies の型はこのプラグインが足している。
// app.ts の import に依存させず、ここで明示的に読み込んでおく。
import "@fastify/cookie";

// authenticate ミドルウェアが載せる値の型。
// 認証そのものは Cognito が行い、ここにはアプリ側の accountId だけを持つ。
declare module "fastify" {
  interface FastifyRequest {
    user: { accountId: number };
  }
}
