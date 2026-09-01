import Fastify from "fastify";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createProductionServer } from "../server.bundle.js";
export { accountPolicyEnabled, buildServer, createProductionServer, selectRoute } from "../server.bundle.js";

void Fastify;
const app = await createProductionServer();
await app.ready();

export default function handler(request: IncomingMessage, response: ServerResponse) {
  app.routing(request, response);
}
