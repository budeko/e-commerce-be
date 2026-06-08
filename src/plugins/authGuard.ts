import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../utils/jwt.js";

const authGuardPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        reply.status(401).send({
          error: "Unauthorized",
          message: "Missing or invalid authorization header",
        });
        return;
      }

      const token = authHeader.slice("Bearer ".length);

      try {
        request.user = verifyToken(token);
      } catch {
        reply.status(401).send({
          error: "Unauthorized",
          message: "Invalid or expired token",
        });
        return;
      }
    },
  );
};

export default fp(authGuardPlugin, {
  name: "authGuard",
});
