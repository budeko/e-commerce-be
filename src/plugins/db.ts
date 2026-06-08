import fp from "fastify-plugin";
import mongoose from "mongoose";
import type { FastifyPluginAsync } from "fastify";
import "../models/index.js";

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  await mongoose.connect(databaseUrl);

  fastify.decorate("db", mongoose.connection);

  fastify.addHook("onClose", async () => {
    await mongoose.disconnect();
  });
};

export default fp(dbPlugin, {
  name: "db",
});
