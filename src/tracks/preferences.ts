import type { Locale } from "../i18n.ts";
import { nodeRequest } from "../backend/api.ts";

export type TrackOption = { id: string; name: string; slug?: string };
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
  void userId;
  const token = await getToken();
  if (!token) throw new TrackPreferencesError("unauthenticated", 401);
  try { return await nodeRequest<TrackPreferenceState>({ path: `/me/track-preferences?locale=${encodeURIComponent(locale)}`, token, fetchImpl }); }
  catch (error) { throw new TrackPreferencesError((error as { code?: string }).code ?? "track_preferences_unavailable", (error as { status?: number }).status ?? 503); }
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
  const token = await getToken();
  if (!token) throw new TrackPreferencesError("unauthenticated", 401);
  try { await nodeRequest({ path: "/me/track-preferences", token, fetchImpl, init: { method: "PUT", body: JSON.stringify({ trackIds: [...new Set(trackIds)], defaultTrackId }) } }); }
  catch (error) { throw new TrackPreferencesError((error as { code?: string }).code ?? "track_preferences_unavailable", (error as { status?: number }).status ?? 503); }
}

export async function loadPublicTracks({ locale, fetchImpl = fetch }: { locale: Locale; fetchImpl?: FetchLike }): Promise<TrackOption[]> {
  try { return (await nodeRequest<{ tracks: TrackOption[] }>({ path: `/tracks?locale=${encodeURIComponent(locale)}`, fetchImpl })).tracks; }
  catch (error) { throw new TrackPreferencesError((error as { code?: string }).code ?? "track_preferences_unavailable", (error as { status?: number }).status ?? 503); }
}
