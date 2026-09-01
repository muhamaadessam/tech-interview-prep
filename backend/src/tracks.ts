export type TrackOption = { id: string; slug?: string; name: string };
export type TrackPreference = { trackId: string; isDefault: boolean };
export type TrackPreferenceState = { tracks: TrackOption[]; preferences: TrackPreference[]; unavailableTracks: TrackOption[] };

export type TrackStore = {
  listTracks: (locale: string) => Promise<TrackOption[]>;
  getPreferences: (userId: string, locale: string) => Promise<TrackPreferenceState>;
  savePreferences: (userId: string, trackIds: string[], defaultTrackId: string) => Promise<void>;
};

export class TrackStoreError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) { super(code); this.name = "TrackStoreError"; this.code = code; this.status = status; }
}

type FetchLike = typeof fetch;

function names(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const row = value[0];
  return row && typeof row === "object" && "name" in row && typeof row.name === "string" ? row.name : null;
}

function related(value: unknown): { id?: unknown; is_active?: unknown; track_locales?: unknown } | null {
  if (!value || typeof value !== "object") return null;
  return Array.isArray(value) ? related(value[0]) : value as { id?: unknown; is_active?: unknown; track_locales?: unknown };
}

export function createSupabaseTrackStore(options: { url: string; serviceRoleKey: string; fetchImpl?: FetchLike }): TrackStore {
  const fetchImpl = options.fetchImpl ?? fetch;
  const base = options.url.replace(/\/$/, "");
  const request = async (path: string, init?: RequestInit) => {
    const response = await fetchUpstream(fetchImpl, `${base}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: options.serviceRoleKey, Authorization: `Bearer ${options.serviceRoleKey}`, Accept: "application/json", ...init?.headers },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { code?: unknown; message?: unknown };
      throw new TrackStoreError(typeof body.code === "string" ? body.code : "track_store_request_failed", response.status);
    }
    return response;
  };

  return {
    async listTracks(locale) {
      const rows = await (await request(`tracks?select=id,slug,track_locales!inner(locale,name)&is_active=eq.true&track_locales.locale=eq.${encodeURIComponent(locale)}&order=id`)).json() as Array<{ id?: unknown; slug?: unknown; track_locales?: unknown }>;
      return rows.flatMap((row) => { const name = names(row.track_locales); return typeof row.id === "string" && typeof row.slug === "string" && name ? [{ id: row.id, slug: row.slug, name }] : []; });
    },
    async getPreferences(userId, locale) {
      const [tracks, preferences] = await Promise.all([
        this.listTracks(locale),
        (await request(`account_track_preferences?select=track_id,is_default,tracks(id,is_active,track_locales(locale,name))&user_id=eq.${encodeURIComponent(userId)}&tracks.track_locales.locale=eq.${encodeURIComponent(locale)}&order=created_at`)).json() as Promise<Array<{ track_id?: unknown; is_default?: unknown; tracks?: unknown }>>,
      ]);
      return {
        tracks,
        preferences: preferences.flatMap((row) => typeof row.track_id === "string" && typeof row.is_default === "boolean" ? [{ trackId: row.track_id, isDefault: row.is_default }] : []),
        unavailableTracks: preferences.flatMap((row) => { const track = related(row.tracks); const name = names(track?.track_locales); return track?.is_active === false && typeof track.id === "string" && name ? [{ id: track.id, name }] : []; }),
      };
    },
    async savePreferences(userId, trackIds, defaultTrackId) {
      const response = await fetchUpstream(fetchImpl, `${base}/rest/v1/rpc/set_track_preferences_for_account`, { method: "POST", headers: { apikey: options.serviceRoleKey, Authorization: `Bearer ${options.serviceRoleKey}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ p_account_id: userId, p_track_ids: [...new Set(trackIds)], p_default_track_id: defaultTrackId }) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { code?: unknown; message?: unknown };
        const message = typeof body.message === "string" ? body.message : "";
        const code = message.includes("At least one") ? "tracks_required" : message.includes("Default Track") ? "default_required" : typeof body.code === "string" ? body.code : "track_preferences_save_failed";
        const status = response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500 ? response.status : 400;
        throw new TrackStoreError(code, status);
      }
    },
  };
}
import { fetchUpstream } from "./upstream.ts";
