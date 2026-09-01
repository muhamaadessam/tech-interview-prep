import { fetchUpstream } from "./upstream.ts";

export class AccountDeletionError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status = 503) { super(code); this.name = "AccountDeletionError"; this.code = code; this.status = status; }
}

export type AccountDeletionStore = { deleteAccount: (userId: string) => Promise<void> };

async function pseudonymousUserId(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return `user:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function createAccountDeletionStore({ url, serviceRoleKey, clerkSecretKey, fetchImpl = fetch }: { url: string; serviceRoleKey: string; clerkSecretKey: string; fetchImpl?: typeof fetch }): AccountDeletionStore {
  const base = url.replace(/\/$/, "");
  const db = async (path: string, init: RequestInit = {}) => {
    const response = await fetchUpstream(fetchImpl, `${base}${path}`, { ...init, headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    if (!response.ok) throw new AccountDeletionError("account_deletion_unavailable");
    return response;
  };

  return {
    async deleteAccount(userId) {
      try {
        const anonymousId = `deleted:${await pseudonymousUserId(userId)}`;
        await db("/rest/v1/rpc/delete_account_data_for_account", { method: "POST", body: JSON.stringify({ p_account_id: userId, p_anonymous_id: anonymousId }) });
        const deleted = await fetchUpstream(fetchImpl, `https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${clerkSecretKey}`, Accept: "application/json" } });
        if (!deleted.ok && deleted.status !== 404) throw new AccountDeletionError("account_deletion_retryable");
      } catch (error) {
        if (error instanceof AccountDeletionError) throw error;
        throw new AccountDeletionError("account_deletion_unavailable");
      }
    },
  };
}
