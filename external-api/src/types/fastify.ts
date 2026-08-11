import "fastify";

// 認証ミドルウェアが載せる値の型。
// 「どのユーザーか」ではなく「どの相手システムからの呼び出しか」を持つ。
declare module "fastify" {
  interface FastifyRequest {
    client: { clientId: string; name: string };
  }
}
