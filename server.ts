import Fastify from "fastify";
import { createProductionServer } from "./backend/src/server.ts";

// Vercel's Fastify detector requires a direct import in the entrypoint.
void Fastify;

const app = await createProductionServer();
await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });

export default app;
