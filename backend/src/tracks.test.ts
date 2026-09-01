import assert from "node:assert/strict";
import test from "node:test";

import { createSupabaseTrackStore, TrackStoreError } from "./tracks.ts";

test("Track store reads active and historical preferences with server credentials", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const store = createSupabaseTrackStore({ url: "https://db.example/", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => {
    requests.push({ url: String(input), init });
    return Response.json(String(input).includes("account_track_preferences") ? [{ track_id: "flutter", is_default: true, tracks: { id: "flutter", is_active: false, track_locales: [{ name: "Flutter" }] } }] : [{ id: "backend", slug: "backend", track_locales: [{ name: "Backend" }] }]);
  } });

  assert.deepEqual(await store.listTracks("en"), [{ id: "backend", slug: "backend", name: "Backend" }]);
  assert.deepEqual(await store.getPreferences("user/one", "en"), {
    tracks: [{ id: "backend", slug: "backend", name: "Backend" }],
    preferences: [{ trackId: "flutter", isDefault: true }],
    unavailableTracks: [{ id: "flutter", name: "Flutter" }],
  });
  assert.equal(new Headers(requests[0].init?.headers).get("Authorization"), "Bearer service-secret");
  assert.ok(requests.some(({ url }) => url.includes("user_id=eq.user%2Fone")));
});

test("Track Preference saves use the server-only Account RPC", async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  const store = createSupabaseTrackStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async (input, init) => { request = { url: String(input), init }; return new Response(null, { status: 204 }); } });
  await store.savePreferences("user_123", ["flutter", "flutter"], "flutter");

  assert.equal(request?.url, "https://db.example/rest/v1/rpc/set_track_preferences_for_account");
  assert.equal(new Headers(request?.init?.headers).get("Authorization"), "Bearer service-secret");
  assert.deepEqual(JSON.parse(String(request?.init?.body)), { p_account_id: "user_123", p_track_ids: ["flutter"], p_default_track_id: "flutter" });
});

test("Track Preference RPC validation keeps stable client errors", async () => {
  const store = createSupabaseTrackStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async () => Response.json({ code: "22023", message: "At least one active Track Preference is required" }, { status: 400 }) });
  await assert.rejects(store.savePreferences("user_123", ["flutter"], "flutter"), (error: unknown) => error instanceof TrackStoreError && error.code === "tracks_required" && error.status === 400);
});

test("Track Preference RPC outages preserve retryable status", async () => {
  const store = createSupabaseTrackStore({ url: "https://db.example", serviceRoleKey: "service-secret", fetchImpl: async () => Response.json({ message: "database unavailable" }, { status: 503 }) });
  await assert.rejects(store.savePreferences("user_123", ["flutter"], "flutter"), (error: unknown) => error instanceof TrackStoreError && error.status === 503);
});
