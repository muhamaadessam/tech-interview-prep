import assert from "node:assert/strict";
import test from "node:test";

import { createAccountDeletionStore } from "./account-deletion.ts";

test("account deletion atomically cleans database data before removing the Clerk account", async () => {
  const requests: Request[] = [];
  const store = createAccountDeletionStore({ url: "https://db.example", serviceRoleKey: "service-secret", clerkSecretKey: "clerk-secret", fetchImpl: async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    return new Response(null, { status: 204 });
  } });

  await store.deleteAccount("account-1");

  const cleanup = requests[0];
  assert.equal(cleanup.url, "https://db.example/rest/v1/rpc/delete_account_data_for_account");
  assert.equal(cleanup.method, "POST");
  assert.deepEqual(await cleanup.clone().json(), { p_account_id: "account-1", p_anonymous_id: "deleted:user:07e998012c1137decdf3efbbb1c3ee6d79b015638cbc197bdbcce1875de4faad" });
  assert.ok(requests.some((request) => request.url === "https://api.clerk.com/v1/users/account-1" && request.method === "DELETE" && request.headers.get("Authorization") === "Bearer clerk-secret"));
  assert.ok(requests.filter((request) => request.url.startsWith("https://db.example/")).every((request) => request.headers.get("Authorization") === "Bearer service-secret"));
});
