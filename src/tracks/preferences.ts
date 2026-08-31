import { createClient } from "@supabase/supabase-js";

import type { Locale } from "../i18n.ts";
import { getSupabaseToken } from "../supabase/auth-token.ts";

export type TrackOption = { id: string; name: string };
export type TrackPreference = { trackId: string; isDefault: boolean };
export type TrackPreferenceState = { tracks: TrackOption[]; preferences: TrackPreference[]; unavailableTracks: TrackOption[] };
export type TrackSelection = { selected: string[]; defaultTrack: string; onboarding: boolean; recovery: boolean };

type FetchLike = typeof fetch;
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

async function authenticatedClient(getToken: TokenProvider, fetchImpl: FetchLike) {
  const configured = config();
  if (!configured) throw new TrackPreferencesError("track_preferences_unavailable", 503);
  const token = await getSupabaseToken(getToken);
  if (!token) throw new TrackPreferencesError("unauthenticated", 401);
  return createClient(configured.url, configured.key, {
    accessToken: async () => token,
    global: { fetch: fetchImpl },
  });
}

function fail(error: { code?: string; message?: string } | null): never {
  throw new TrackPreferencesError(error?.code ?? "track_preferences_unavailable", 500);
}

function relatedTrack(value: unknown): { id?: unknown; is_active?: unknown; track_locales?: unknown } | null {
  if (!value || typeof value !== "object") return null;
  return Array.isArray(value) ? relatedTrack(value[0]) : value;
}

function localizedName(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const first = value[0];
  return first && typeof first === "object" && "name" in first && typeof first.name === "string" ? first.name : null;
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
  const client = await authenticatedClient(getToken, fetchImpl);
  const [tracksResult, preferencesResult] = await Promise.all([
    client.from("tracks").select("id,is_active,track_locales!inner(locale,name)").eq("is_active", true).eq("track_locales.locale", locale).order("id"),
    client.from("account_track_preferences").select("track_id,is_default,tracks(id,is_active,track_locales(locale,name))").eq("user_id", userId).eq("tracks.track_locales.locale", locale).order("created_at"),
  ]);
  if (tracksResult.error) fail(tracksResult.error);
  if (preferencesResult.error) fail(preferencesResult.error);
  const trackRows = tracksResult.data ?? [];
  const preferenceRows = preferencesResult.data ?? [];
  return {
    tracks: trackRows.flatMap((row) => {
      const name = localizedName(row.track_locales);
      return typeof row.id === "string" && name ? [{ id: row.id, name }] : [];
    }),
    preferences: preferenceRows.flatMap((row) => typeof row.track_id === "string" && typeof row.is_default === "boolean" ? [{ trackId: row.track_id, isDefault: row.is_default }] : []),
    unavailableTracks: preferenceRows.flatMap((row) => {
      const track = relatedTrack(row.tracks);
      const name = localizedName(track?.track_locales);
      return track?.is_active === false && typeof track.id === "string" && name ? [{ id: track.id, name }] : [];
    }),
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
  const client = await authenticatedClient(getToken, fetchImpl);
  const { error } = await client.rpc("set_track_preferences", {
    p_track_ids: [...new Set(trackIds)],
    p_default_track_id: defaultTrackId,
  });
  if (error) fail(error);
}
