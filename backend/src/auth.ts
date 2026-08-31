import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { FastifyRequest } from "fastify";

export type AccountContext = { sub: string; claims: JWTPayload; token?: string };

export type ClerkAuthOptions = {
  jwksUrl: string;
  issuer: string;
  cacheMaxAge?: number;
  cooldownDuration?: number;
  timeoutDuration?: number;
};

export class AuthError extends Error {
  readonly code: string;
  readonly statusCode = 401;

  constructor(code = "invalid_token") {
    super(code);
    this.name = "AuthError";
    this.code = code;
  }
}

export type ClerkAuth = { preHandler: (request: FastifyRequest) => Promise<void> };

export function createClerkAuth(options: ClerkAuthOptions): ClerkAuth {
  const jwks = createRemoteJWKSet(new URL(options.jwksUrl), {
    cacheMaxAge: options.cacheMaxAge ?? 10 * 60 * 1000,
    cooldownDuration: options.cooldownDuration ?? 30 * 1000,
    timeoutDuration: options.timeoutDuration ?? 5 * 1000,
  });

  return {
    async preHandler(request) {
      try {
        const header = request.headers.authorization;
        const match = typeof header === "string" ? /^Bearer\s+(\S+)$/i.exec(header) : null;
        if (!match) throw new AuthError("missing_bearer_token");

        const { payload } = await jwtVerify(match[1], jwks, { issuer: options.issuer, algorithms: ["RS256"] });
        if (typeof payload.sub !== "string" || payload.sub.length === 0) throw new AuthError("invalid_subject");
        request.account = { sub: payload.sub, claims: payload, token: match[1] };
      } catch (error) {
        if (error instanceof AuthError) throw error;
        throw new AuthError("invalid_token");
      }
    },
  };
}

declare module "fastify" {
  interface FastifyRequest {
    account: AccountContext | null;
  }
}
