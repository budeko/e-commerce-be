import Fastify from "fastify";
import dbPlugin from "./plugins/db.js";
import authGuardPlugin from "./plugins/authGuard.js";
import { authRoutes } from "./modules/auth/auth.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(dbPlugin);
  await app.register(authGuardPlugin);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api/auth" });

  return app;
}
