"use client";

import { useAuth } from "@clerk/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { tracks } from "../content/questions";
import { localeFromPathname, localizedHref, messages, type Locale } from "../i18n";
import { resolveActiveTrack, withQueryContext } from "../tracks/active-track";
import { loadTrackPreferences, type TrackPreferenceState } from "../tracks/preferences";
import { LoadingPlaceholder } from "./loading-placeholder";

type Phase = "loading" | "ready" | "error";
type ActiveTrackValue = {
  phase: Phase;
  authenticated: boolean;
  activeTrack: (typeof tracks)[number] | null;
  selectableTracks: typeof tracks;
  invalidTrack: boolean;
  setActiveTrack: (trackId: string) => void;
  trackHref: (path: string) => string;
  retry: () => void;
};

const ActiveTrackContext = createContext<ActiveTrackValue | null>(null);

export function AnonymousActiveTrackProvider({ children }: { children: ReactNode }) {
  return <ActiveTrackProvider authenticated={false}>{children}</ActiveTrackProvider>;
}

export function AuthenticatedActiveTrackProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  return <ActiveTrackProvider authenticated={Boolean(isLoaded && isSignedIn)} loading={!isLoaded} userId={userId} getToken={getToken}>{children}</ActiveTrackProvider>;
}

function ActiveTrackProvider({ children, authenticated, loading = false, userId, getToken }: {
  children: ReactNode;
  authenticated: boolean;
  loading?: boolean;
  userId?: string | null;
  getToken?: ReturnType<typeof useAuth>["getToken"];
}) {
  const pathname = usePathname() ?? "/";
  const locale = localeFromPathname(pathname);
  const [query, setQuery] = useState("");
  const requestedTrack = new URLSearchParams(query).get("track");
  const [urlReady, setUrlReady] = useState(false);
  const [preferences, setPreferences] = useState<TrackPreferenceState | null>(null);
  const [phase, setPhase] = useState<Phase>(loading || authenticated ? "loading" : "ready");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const sync = () => { setQuery(window.location.search); setUrlReady(true); };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("urlchange", sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("urlchange", sync); };
  }, []);

  useEffect(() => {
    if (loading) { setPhase("loading"); return; }
    if (!authenticated || !userId || !getToken) { setPreferences(null); setPhase("ready"); return; }
    let current = true;
    setPhase("loading");
    loadTrackPreferences({ userId, locale, getToken })
      .then((state) => { if (current) { setPreferences(state); setPhase("ready"); } })
      .catch(() => { if (current) setPhase("error"); });
    return () => { current = false; };
  }, [authenticated, getToken, loading, locale, reload, userId]);

  useEffect(() => {
    const retry = () => setReload((value) => value + 1);
    window.addEventListener("track-preferences-changed", retry);
    return () => window.removeEventListener("track-preferences-changed", retry);
  }, []);

  const resolution = resolveActiveTrack({
    requestedTrack,
    tracks,
    activeTrackIds: authenticated ? (preferences?.tracks.map(({ id }) => id) ?? []) : tracks.map(({ id }) => id),
    preferenceTrackIds: preferences?.preferences.map(({ trackId }) => trackId) ?? [],
    defaultTrackId: preferences?.preferences.find(({ isDefault }) => isDefault)?.trackId ?? null,
    authenticated,
  });
  const setActiveTrack = useCallback((trackId: string) => {
    const track = resolution.selectableTracks.find(({ id, slug }) => id === trackId || slug === trackId);
    if (!track) return;
    const params = new URLSearchParams(window.location.search);
    params.set("track", track.slug);
    params.delete("topic");
    params.delete("topics");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
    window.dispatchEvent(new Event("urlchange"));
  }, [resolution.selectableTracks]);
  const value = useMemo<ActiveTrackValue>(() => ({
    phase: !urlReady || (authenticated && !preferences && phase === "ready") ? "loading" : phase,
    authenticated,
    ...resolution,
    setActiveTrack,
    trackHref: (path) => withQueryContext(path, query, resolution.activeTrack?.slug),
    retry: () => setReload((current) => current + 1),
  }), [authenticated, phase, preferences, query, resolution, setActiveTrack, urlReady]);
  return <ActiveTrackContext.Provider value={value}>{children}</ActiveTrackContext.Provider>;
}

export function useActiveTrack(): ActiveTrackValue {
  const value = useContext(ActiveTrackContext);
  if (!value) throw new Error("ActiveTrackProvider is required");
  return value;
}

export function ActiveTrackSelector({ locale }: { locale: Locale }) {
  const { phase, authenticated, activeTrack, selectableTracks, invalidTrack, setActiveTrack, retry } = useActiveTrack();
  const copy = messages[locale];
  if (phase === "loading") return <LoadingPlaceholder />;
  if (phase === "error") return <div className="empty-state"><h2>{copy.activeTrackUnavailable}</h2><button className="button primary" type="button" onClick={retry}>{copy.tracksRetry}</button></div>;
  if (invalidTrack) return <ActiveTrackRecovery locale={locale} />;
  if (!activeTrack) return <div className="empty-state"><h2>{copy.emptyTrackTitle}</h2><p>{copy.emptyTrackDescription}</p>{authenticated && <Link className="button" href={localizedHref(locale, "/my-tracks")}>{copy.manageTrackPreferences}</Link>}</div>;
  return <div className="active-track-selector">
    <label>{copy.activeTrack}<select value={activeTrack.id} onChange={(event) => setActiveTrack(event.target.value)}>{selectableTracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}</select></label>
    {authenticated && <Link className="text-link" href={localizedHref(locale, "/my-tracks")}>{copy.manageTrackPreferences}</Link>}
  </div>;
}

export function ActiveTrackRecovery({ locale, invalidTopic = false }: { locale: Locale; invalidTopic?: boolean }) {
  const { authenticated, selectableTracks, setActiveTrack } = useActiveTrack();
  const copy = messages[locale];
  return <div className="empty-state"><h2>{invalidTopic ? copy.invalidTrackTopicTitle : copy.invalidTrackTitle}</h2><p>{copy.invalidTrackDescription}</p><div className="actions">{selectableTracks.map((track) => <button className="button" key={track.id} type="button" onClick={() => setActiveTrack(track.id)}>{copy.changeTrackTo} {track.name}</button>)}{authenticated && <Link className="button" href={localizedHref(locale, "/my-tracks")}>{copy.manageTrackPreferences}</Link>}</div></div>;
}

export function ActiveTrackLink({ locale, path, className, children }: { locale: Locale; path: string; className?: string; children: ReactNode }) {
  const { trackHref } = useActiveTrack();
  return <Link className={className} href={localizedHref(locale, trackHref(path))}>{children}</Link>;
}

export function TrackContextGuard({ locale, trackId, children }: { locale: Locale; trackId: string; children: ReactNode }) {
  const { phase, activeTrack, invalidTrack } = useActiveTrack();
  if (phase !== "ready") return <section className="shell section"><ActiveTrackSelector locale={locale} /></section>;
  if (invalidTrack || !activeTrack || activeTrack.id !== trackId) return <section className="shell section"><ActiveTrackRecovery locale={locale} invalidTopic /></section>;
  return children;
}
