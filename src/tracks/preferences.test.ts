import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-key";

const { loadPublicTracks, loadTrackPreferences, resolveTrackSelection, saveTrackPreferences, TrackPreferencesError, validateTrackPreferences } = await import("./preferences.ts");

test("Track Preferences require a selected Default Track", () => {
  assert.equal(validateTrackPreferences([], ""), "tracks_required");
  assert.equal(validateTrackPreferences(["flutter"], "backend"), "default_required");
  assert.equal(validateTrackPreferences(["flutter"], "flutter"), null);
});

test("Onboarding preselects the only active Track and detects unavailable preferences", () => {
  assert.deepEqual(resolveTrackSelection({ tracks: [{ id: "flutter", name: "Flutter" }], preferences: [], unavailableTracks: [] }), {
    selected: ["flutter"], defaultTrack: "flutter", onboarding: true, recovery: false,
  });
  assert.deepEqual(resolveTrackSelection({ tracks: [{ id: "backend", name: "Backend" }], preferences: [{ trackId: "flutter", isDefault: true }], unavailableTracks: [{ id: "flutter", name: "Flutter" }] }), {
    selected: ["backend"], defaultTrack: "backend", onboarding: true, recovery: true,
  });
});

test("active and historical unavailable Track Preferences load through the authenticated Supabase client", async () => {
  const urls: string[] = [];
  const result = await loadTrackPreferences({
    userId: "user/one",
    locale: "en",
    getToken: async () => "clerk-token",
    fetchImpl: async (input, init) => {
      const url = String(input);
      urls.push(url);
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer clerk-token");
      return Response.json(url.includes("account_track_preferences")
        ? [{ track_id: "flutter", is_default: true, tracks: { id: "flutter", is_active: false, track_locales: [{ name: "Flutter" }] } }]
        : [{ id: "flutter", track_locales: [{ name: "Flutter" }] }]);
    },
  });
  assert.deepEqual(result, {
    tracks: [{ id: "flutter", name: "Flutter" }],
    preferences: [{ trackId: "flutter", isDefault: true }],
    unavailableTracks: [{ id: "flutter", name: "Flutter" }],
  });
  assert.ok(urls.some((url) => url.includes("is_active=eq.true")));
  assert.ok(urls.some((url) => url.includes("user_id=eq.user%2Fone")));
});

test("Track Preferences use Node when the migration flag is enabled", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example";
  process.env.NEXT_PUBLIC_NODE_API_ENABLED = "true";
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  try {
    const result = await loadTrackPreferences({ userId: "ignored-by-server", locale: "en", getToken: async (options) => { assert.equal(options?.template, "supabase"); return "clerk-token"; }, fetchImpl: async (input, init) => {
      requests.push({ url: String(input), init });
      return Response.json({ tracks: [{ id: "flutter", name: "Flutter" }], preferences: [{ trackId: "flutter", isDefault: true }], unavailableTracks: [] });
    } });
    assert.deepEqual(result.tracks, [{ id: "flutter", name: "Flutter" }]);
    assert.equal(requests[0].url, "https://api.example/v1/me/track-preferences?locale=en");
    assert.equal(new Headers(requests[0].init?.headers).get("Authorization"), "Bearer clerk-token");

    await saveTrackPreferences({ trackIds: ["flutter"], defaultTrackId: "flutter", getToken: async (options) => { assert.equal(options?.template, "supabase"); return "clerk-token"; }, fetchImpl: async (input, init) => { requests.push({ url: String(input), init }); return new Response(null, { status: 204 }); } });
    assert.equal(requests[1].url, "https://api.example/v1/me/track-preferences");
    assert.equal(requests[1].init?.method, "PUT");
    assert.deepEqual(JSON.parse(String(requests[1].init?.body)), { trackIds: ["flutter"], defaultTrackId: "flutter" });
  } finally {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_NODE_API_ENABLED;
  }
});

test("anonymous Track reads use the Node catalogue when enabled", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example";
  process.env.NEXT_PUBLIC_NODE_API_ENABLED = "true";
  try {
    const tracks = await loadPublicTracks({ locale: "ar", fetchImpl: async (input) => {
      assert.equal(String(input), "https://api.example/v1/tracks?locale=ar");
      return Response.json({ tracks: [{ id: "flutter", slug: "flutter", name: "فلاتر" }] });
    } });
    assert.deepEqual(tracks, [{ id: "flutter", slug: "flutter", name: "فلاتر" }]);
  } finally {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_NODE_API_ENABLED;
  }
});

test("disabling the Node flag keeps the legacy Supabase implementation", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example";
  process.env.NEXT_PUBLIC_NODE_API_ENABLED = "false";
  try {
    const urls: string[] = [];
    await loadTrackPreferences({ userId: "user_123", locale: "en", getToken: async () => "clerk-token", fetchImpl: async (input) => {
      urls.push(String(input));
      return Response.json(String(input).includes("account_track_preferences") ? [] : [{ id: "flutter", track_locales: [{ name: "Flutter" }] }]);
    } });
    await saveTrackPreferences({ trackIds: ["flutter"], defaultTrackId: "flutter", getToken: async () => "clerk-token", fetchImpl: async (input, init) => {
      urls.push(String(input));
      return new Response(null, { status: 204 });
    } });
    assert.ok(urls.every((url) => !url.startsWith("https://api.example")));
    assert.ok(urls.some((url) => url.includes("/rest/v1/tracks")));
    assert.ok(urls.some((url) => url.includes("/rest/v1/rpc/set_track_preferences")));
  } finally {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_NODE_API_ENABLED;
  }
});

test("saving Track Preferences uses the authorized atomic RPC and deduplicates Tracks", async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  await saveTrackPreferences({
    trackIds: ["flutter", "flutter"],
    defaultTrackId: "flutter",
    getToken: async () => "clerk-token",
    fetchImpl: async (input, init) => { request = { url: String(input), init }; return new Response(null, { status: 204 }); },
  });
  assert.match(request?.url ?? "", /\/rest\/v1\/rpc\/set_track_preferences$/);
  assert.deepEqual(JSON.parse(String(request?.init?.body)), { p_track_ids: ["flutter"], p_default_track_id: "flutter" });
});

test("saving cannot remove the last active Track Preference", async () => {
  await assert.rejects(
    saveTrackPreferences({ trackIds: [], defaultTrackId: "", getToken: async () => "clerk-token" }),
    (error: unknown) => error instanceof TrackPreferencesError && error.code === "tracks_required",
  );
});

test("the database contract isolates Accounts and preserves unavailable historical Track Preferences", async () => {
  const migration = await readFile(new URL("../../supabase/migrations/20260831000000_track_preferences.sql", import.meta.url), "utf8");
  assert.match(migration, /account_track_preferences_owner_read[\s\S]*user_id = public\.current_clerk_user_id\(\)/);
  assert.match(migration, /tracks_public_read[\s\S]*is_active[\s\S]*account_track_preferences[\s\S]*current_clerk_user_id\(\)/);
  assert.match(migration, /delete from public\.account_track_preferences[\s\S]*tracks[\s\S]*is_active/);
});
