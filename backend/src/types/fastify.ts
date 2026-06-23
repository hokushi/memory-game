import "@fastify/jwt";

// JWT のペイロード型（アクセストークンには account.id を入れる）
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { accountId: number };
    user: { accountId: number };
  }
}
