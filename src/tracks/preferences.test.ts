import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-key";

const { loadTrackPreferences, resolveTrackSelection, saveTrackPreferences, TrackPreferencesError, validateTrackPreferences } = await import("./preferences.ts");

test("Track Preferences require a selected Default Track", () => {
  assert.equal(validateTrackPreferences([], ""), "tracks_required");
  assert.equal(validateTrackPreferences(["flutter"], "backend"), "default_required");
  assert.equal(validateTrackPreferences(["flutter"], "flutter"), null);
});

test("Onboarding preselects the only active Track and detects unavailable preferences", () => {
  assert.deepEqual(resolveTrackSelection({ tracks: [{ id: "flutter", name: "Flutter" }], preferences: [] }), {
    selected: ["flutter"], defaultTrack: "flutter", onboarding: true, recovery: false,
  });
  assert.deepEqual(resolveTrackSelection({ tracks: [{ id: "backend", name: "Backend" }], preferences: [{ trackId: "flutter", isDefault: true }] }), {
    selected: ["backend"], defaultTrack: "backend", onboarding: true, recovery: true,
  });
});

test("active Tracks and Account preferences load through authenticated REST", async () => {
  const urls: string[] = [];
  const result = await loadTrackPreferences({
    userId: "user/one",
    locale: "en",
    getToken: async () => "clerk-token",
    fetchImpl: async (url, init) => {
      urls.push(url);
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer clerk-token");
      return Response.json(url.includes("account_track_preferences")
        ? [{ track_id: "flutter", is_default: true }]
        : [{ id: "flutter", track_locales: [{ name: "Flutter" }] }]);
    },
  });
  assert.deepEqual(result, { tracks: [{ id: "flutter", name: "Flutter" }], preferences: [{ trackId: "flutter", isDefault: true }] });
  assert.ok(urls.some((url) => url.includes("is_active=eq.true")));
  assert.ok(urls.some((url) => url.includes("user_id=eq.user%2Fone")));
});

test("saving Track Preferences uses the authorized atomic RPC and deduplicates Tracks", async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  await saveTrackPreferences({
    trackIds: ["flutter", "flutter"],
    defaultTrackId: "flutter",
    getToken: async () => "clerk-token",
    fetchImpl: async (url, init) => { request = { url, init }; return new Response(null, { status: 204 }); },
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
