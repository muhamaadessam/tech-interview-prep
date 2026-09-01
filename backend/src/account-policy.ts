import type { FastifyRequest } from "fastify";
import { fetchUpstream } from "./upstream.ts";

export type AccountRole = { role?: string; suspended?: boolean };

export type AccountRoleStore = { getRole: (userId: string) => Promise<AccountRole | null> };

export class PolicyError extends Error {
  readonly code: string;
  readonly statusCode: number;
  constructor(code: string, statusCode = 403) {
    super(code);
    this.name = "PolicyError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function account(request: FastifyRequest): NonNullable<FastifyRequest["account"]> {
  if (!request.account) throw new PolicyError("authentication_required", 401);
  return request.account;
}

function requestAccountId(request: FastifyRequest): string | undefined {
  const values = [request.params, request.query, request.body];
  for (const value of values) {
    if (typeof value === "object" && value !== null && "accountId" in value && typeof value.accountId === "string") return value.accountId;
  }
  return undefined;
}

export function createAccountPolicy(store: AccountRoleStore) {
  return {
    requireAuthenticated: async (request: FastifyRequest) => {
      const actor = account(request);
      if ((await store.getRole(actor.sub))?.suspended === true) throw new PolicyError("account_suspended");
    },
    requireModerator: async (request: FastifyRequest) => {
      const actor = account(request);
      const role = await store.getRole(actor.sub);
      if (role?.role !== "moderator" || role.suspended === true) throw new PolicyError("moderator_required");
    },
    requireConfirmedEmail: async (request: FastifyRequest) => {
      const actor = account(request);
      if ((await store.getRole(actor.sub))?.suspended === true) throw new PolicyError("account_suspended");
      if (actor.claims.email_verified !== true && actor.claims.email_verified !== "true") throw new PolicyError("email_confirmation_required");
    },
    requireOwnership: async (request: FastifyRequest) => {
      const actor = account(request);
      if ((await store.getRole(actor.sub))?.suspended === true) throw new PolicyError("account_suspended");
      const requested = requestAccountId(request);
      if (requested !== undefined && requested !== actor.sub) throw new PolicyError("account_ownership_mismatch");
      return actor.sub;
    },
  };
}

export function createSupabaseAccountRoleStore(options: { url: string; serviceRoleKey: string; fetchImpl?: typeof fetch }): AccountRoleStore {
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    async getRole(userId) {
      const query = `${options.url.replace(/\/$/, "")}/rest/v1/account_roles?select=role,suspended&user_id=eq.${encodeURIComponent(userId)}&limit=1`;
      const response = await fetchUpstream(fetchImpl, query, { headers: { apikey: options.serviceRoleKey, Authorization: `Bearer ${options.serviceRoleKey}`, Accept: "application/json" } });
      if (!response.ok) throw new Error("account_role_lookup_failed");
      const rows = await response.json() as AccountRole[];
      return rows[0] ?? null;
    },
  };
}
