import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadPublicTracks, loadTrackPreferences, resolveTrackSelection, saveTrackPreferences, TrackPreferencesError, validateTrackPreferences } from "./preferences.ts";

process.env.NEXT_PUBLIC_API_URL = "https://api.example";

test("Track Preferences require a selected Default Track", () => {
  assert.equal(validateTrackPreferences([], ""), "tracks_required");
  assert.equal(validateTrackPreferences(["flutter"], "backend"), "default_required");
  assert.equal(validateTrackPreferences(["flutter"], "flutter"), null);
});

test("Onboarding preselects the only active Track and detects unavailable preferences", () => {
  assert.deepEqual(resolveTrackSelection({ tracks: [{ id: "flutter", name: "Flutter" }], preferences: [], unavailableTracks: [] }), { selected: ["flutter"], defaultTrack: "flutter", onboarding: true, recovery: false });
  assert.deepEqual(resolveTrackSelection({ tracks: [{ id: "backend", name: "Backend" }], preferences: [{ trackId: "flutter", isDefault: true }], unavailableTracks: [{ id: "flutter", name: "Flutter" }] }), { selected: ["backend"], defaultTrack: "backend", onboarding: true, recovery: true });
});

test("Track Preferences read and write only through Node", async () => {
  const requests: Request[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    requests.push(new Request(input, init));
    return init?.method === "PUT" ? new Response(null, { status: 204 }) : Response.json({ tracks: [{ id: "flutter", name: "Flutter" }], preferences: [{ trackId: "flutter", isDefault: true }], unavailableTracks: [] });
  };
  const state = await loadTrackPreferences({ userId: "browser-id-is-ignored", locale: "en", getToken: async (options) => { assert.equal(options, undefined); return "clerk-token"; }, fetchImpl });
  assert.equal(state.tracks[0].id, "flutter");
  await saveTrackPreferences({ trackIds: ["flutter", "flutter"], defaultTrackId: "flutter", getToken: async () => "clerk-token", fetchImpl });
  assert.deepEqual(requests.map(({ url }) => url), ["https://api.example/v1/me/track-preferences?locale=en", "https://api.example/v1/me/track-preferences"]);
  assert.ok(requests.every((request) => request.headers.get("Authorization") === "Bearer clerk-token"));
  assert.deepEqual(await requests[1].json(), { trackIds: ["flutter"], defaultTrackId: "flutter" });
});

test("anonymous Track reads use the Node catalogue", async () => {
  const tracks = await loadPublicTracks({ locale: "ar", fetchImpl: async (input) => { assert.equal(String(input), "https://api.example/v1/tracks?locale=ar"); return Response.json({ tracks: [{ id: "flutter", slug: "flutter", name: "فلاتر" }] }); } });
  assert.deepEqual(tracks, [{ id: "flutter", slug: "flutter", name: "فلاتر" }]);
});

test("saving cannot remove the last active Track Preference", async () => {
  await assert.rejects(saveTrackPreferences({ trackIds: [], defaultTrackId: "", getToken: async () => "clerk-token" }), (error: unknown) => error instanceof TrackPreferencesError && error.code === "tracks_required");
});

test("the database contract isolates Accounts and exposes server-only mutation", async () => {
  const ownerMigration = await readFile(new URL("../../supabase/migrations/20260831000000_track_preferences.sql", import.meta.url), "utf8");
  const backendMigration = await readFile(new URL("../../supabase/migrations/20260901000001_backend_only_rpc.sql", import.meta.url), "utf8");
  assert.match(ownerMigration, /account_track_preferences_owner_read[\s\S]*user_id = public\.current_clerk_user_id\(\)/);
  assert.match(backendMigration, /set_track_preferences_for_account[\s\S]*grant execute[\s\S]*service_role/);
});
