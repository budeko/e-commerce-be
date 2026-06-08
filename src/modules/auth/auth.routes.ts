import type { FastifyInstance } from "fastify";
import { createAuthController } from "./auth.controller.js";
import { loginSchema, meSchema, registerSchema } from "./auth.schema.js";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = createAuthController(fastify);

  fastify.post(
    "/register",
    { schema: registerSchema },
    controller.register,
  );

  fastify.post("/login", { schema: loginSchema }, controller.login);

  fastify.get(
    "/me",
    {
      schema: meSchema,
      preHandler: [fastify.authenticate],
    },
    controller.me,
  );
}
