import type { Connection } from "mongoose";
import type { JwtPayload } from "../utils/jwt.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Connection;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user: JwtPayload;
  }
}
