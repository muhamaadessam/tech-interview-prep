import type { Locale } from "../i18n.ts";

export type TrackOption = { id: string; name: string };
export type TrackPreference = { trackId: string; isDefault: boolean };
export type TrackPreferenceState = { tracks: TrackOption[]; preferences: TrackPreference[] };
export type TrackSelection = { selected: string[]; defaultTrack: string; onboarding: boolean; recovery: boolean };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type TokenProvider = (options?: { template?: string }) => Promise<string | null>;

export class TrackPreferencesError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status; }
}

function config(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

function headers(key: string, token: string): HeadersInit {
  return { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function request(fetchImpl: FetchLike, url: string, init: RequestInit): Promise<Response> {
  const response = await fetchImpl(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { code?: string };
    throw new TrackPreferencesError(body.code ?? "track_preferences_unavailable", response.status);
  }
  return response;
}

async function authenticatedConfig(getToken: TokenProvider): Promise<{ url: string; key: string; token: string }> {
  const configured = config();
  if (!configured) throw new TrackPreferencesError("track_preferences_unavailable", 503);
  const token = await getToken();
  if (!token) throw new TrackPreferencesError("unauthenticated", 401);
  return { ...configured, token };
}

export function validateTrackPreferences(trackIds: string[], defaultTrackId: string): "tracks_required" | "default_required" | null {
  if (!trackIds.length) return "tracks_required";
  if (!trackIds.includes(defaultTrackId)) return "default_required";
  return null;
}

export function resolveTrackSelection({ tracks, preferences }: TrackPreferenceState): TrackSelection {
  const activeIds = new Set(tracks.map((track) => track.id));
  const activeSelected = preferences.map((preference) => preference.trackId).filter((id) => activeIds.has(id));
  const selected = activeSelected.length ? activeSelected : tracks.length === 1 ? [tracks[0].id] : [];
  return {
    selected,
    defaultTrack: preferences.find((preference) => preference.isDefault && activeIds.has(preference.trackId))?.trackId ?? (selected.length === 1 ? selected[0] : ""),
    onboarding: !activeSelected.length,
    recovery: Boolean(preferences.length && !activeSelected.length),
  };
}

export async function loadTrackPreferences({
  userId,
  locale,
  getToken,
  fetchImpl = fetch,
}: {
  userId: string;
  locale: Locale;
  getToken: TokenProvider;
  fetchImpl?: FetchLike;
}): Promise<TrackPreferenceState> {
  const { url, key, token } = await authenticatedConfig(getToken);
  const authHeaders = headers(key, token);
  const [tracksResponse, preferencesResponse] = await Promise.all([
    request(fetchImpl, `${url}/rest/v1/tracks?select=id,track_locales!inner(locale,name)&is_active=eq.true&track_locales.locale=eq.${locale}&order=id`, { headers: authHeaders }),
    request(fetchImpl, `${url}/rest/v1/account_track_preferences?select=track_id,is_default&user_id=eq.${encodeURIComponent(userId)}&order=created_at`, { headers: authHeaders }),
  ]);
  const trackRows = await tracksResponse.json() as Array<{ id?: unknown; track_locales?: Array<{ name?: unknown }> }>;
  const preferenceRows = await preferencesResponse.json() as Array<{ track_id?: unknown; is_default?: unknown }>;
  return {
    tracks: trackRows.flatMap((row) => typeof row.id === "string" && typeof row.track_locales?.[0]?.name === "string" ? [{ id: row.id, name: row.track_locales[0].name }] : []),
    preferences: preferenceRows.flatMap((row) => typeof row.track_id === "string" && typeof row.is_default === "boolean" ? [{ trackId: row.track_id, isDefault: row.is_default }] : []),
  };
}

export async function saveTrackPreferences({
  trackIds,
  defaultTrackId,
  getToken,
  fetchImpl = fetch,
}: {
  trackIds: string[];
  defaultTrackId: string;
  getToken: TokenProvider;
  fetchImpl?: FetchLike;
}): Promise<void> {
  const validation = validateTrackPreferences(trackIds, defaultTrackId);
  if (validation) throw new TrackPreferencesError(validation, 400);
  const { url, key, token } = await authenticatedConfig(getToken);
  await request(fetchImpl, `${url}/rest/v1/rpc/set_track_preferences`, {
    method: "POST",
    headers: headers(key, token),
    body: JSON.stringify({ p_track_ids: [...new Set(trackIds)], p_default_track_id: defaultTrackId }),
  });
}
