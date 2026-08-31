"use client";

import { useAuth } from "@clerk/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { localeFromPathname, messages, type Locale } from "../i18n";
import { loadTrackPreferences, resolveTrackSelection, saveTrackPreferences, validateTrackPreferences, type TrackOption } from "../tracks/preferences";
import { AuthDialogTrigger } from "./auth-dialog";
import { LoadingPlaceholder } from "./loading-placeholder";

type Phase = "loading" | "saving" | "error" | "recovery" | "edit" | "success" | "done";

export function TrackPreferencesGate() {
  const pathname = usePathname() ?? "/";
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  if (!isLoaded || !isSignedIn || /\/my-tracks\/?$/.test(pathname)) return null;
  return <TrackPreferencesManager locale={localeFromPathname(pathname)} mode="gate" userId={userId} getToken={getToken} />;
}

export function MyTracks({ locale, clerkEnabled }: { locale: Locale; clerkEnabled: boolean }) {
  if (!clerkEnabled) return <p className="empty-state">{messages[locale].tracksAuthSetup}</p>;
  return <AuthenticatedMyTracks locale={locale} />;
}

function AuthenticatedMyTracks({ locale }: { locale: Locale }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const copy = messages[locale];
  if (!isLoaded) return <LoadingPlaceholder className="page-loading" />;
  if (!isSignedIn) return <div className="empty-state"><h2>{copy.tracksSignIn}</h2><AuthDialogTrigger locale={locale} className="button primary">{copy.signIn}</AuthDialogTrigger></div>;
  return <TrackPreferencesManager locale={locale} mode="page" userId={userId} getToken={getToken} />;
}

function TrackPreferencesManager({ locale, mode, userId, getToken }: { locale: Locale; mode: "gate" | "page"; userId: string | null | undefined; getToken: ReturnType<typeof useAuth>["getToken"] }) {
  const copy = messages[locale];
  const [phase, setPhase] = useState<Phase>("loading");
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [unavailableTracks, setUnavailableTracks] = useState<TrackOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [defaultTrack, setDefaultTrack] = useState("");
  const [validation, setValidation] = useState("");
  const [saved, setSaved] = useState(false);
  const [onboarding, setOnboarding] = useState(mode === "gate");
  const heading = useRef<HTMLHeadingElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setPhase("loading");
    setValidation("");
    setSaved(false);
    try {
      const state = await loadTrackPreferences({ userId, locale, getToken });
      const selection = resolveTrackSelection(state);
      setTracks(state.tracks);
      setUnavailableTracks(state.unavailableTracks);
      setOnboarding(selection.onboarding);
      setSelected(selection.selected);
      setDefaultTrack(selection.defaultTrack);
      if (selection.recovery) setPhase("recovery");
      else setPhase(mode === "gate" && !selection.onboarding ? "done" : "edit");
    } catch {
      setPhase("error");
    }
  }, [getToken, locale, mode, userId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (phase !== "done") heading.current?.focus(); }, [phase]);

  function toggle(trackId: string) {
    setSaved(false);
    setValidation("");
    if (selected.includes(trackId)) {
      if (selected.length === 1) { setValidation(copy.lastTrackRequired); return; }
      setSelected((current) => current.filter((id) => id !== trackId));
      if (defaultTrack === trackId) setDefaultTrack("");
      return;
    }
    const next = [...selected, trackId];
    setSelected(next);
    if (next.length === 1) setDefaultTrack(trackId);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateTrackPreferences(selected, defaultTrack);
    if (issue) { setValidation(issue === "tracks_required" ? copy.tracksRequired : copy.defaultTrackRequired); return; }
    setPhase("saving");
    try {
      await saveTrackPreferences({ trackIds: selected, defaultTrackId: defaultTrack, getToken });
      window.dispatchEvent(new Event("track-preferences-changed"));
      if (mode === "gate") setPhase("success");
      else { setSaved(true); setPhase("edit"); }
    } catch {
      setPhase("error");
    }
  }

  function trapFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !overlay.current) return;
    const controls = [...overlay.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), a[href]")];
    if (!controls.length) { event.preventDefault(); heading.current?.focus(); return; }
    if (event.shiftKey && (document.activeElement === controls[0] || document.activeElement === heading.current)) { event.preventDefault(); controls.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
  }

  // Keep the page usable while Clerk/Supabase resolve preferences. The modal
  // only appears once we know onboarding is actually required.
  if (phase === "done" || (mode === "gate" && phase === "loading")) return null;

  const unavailableContent = unavailableTracks.length > 0 && <fieldset className="track-options unavailable-tracks"><legend>{copy.unavailableTracksLegend}</legend>{unavailableTracks.map((track) => <div key={track.id} className="unavailable-track"><span>{track.name}</span><small>{copy.trackUnavailable}</small></div>)}</fieldset>;
  const content = <div className="track-preferences-card">
    {phase === "loading" && <LoadingPlaceholder />}
    {phase === "saving" && <><h2 ref={heading} tabIndex={-1}>{copy.tracksSaving}</h2><p className="track-status" role="status">{copy.tracksSaving}</p></>}
    {phase === "error" && <><h2 ref={heading} tabIndex={-1}>{copy.tracksUnavailable}</h2><div className="actions"><button className="button primary" type="button" onClick={() => void load()}>{copy.tracksRetry}</button>{mode === "gate" && <button className="button" type="button" onClick={() => setPhase("done")}>{copy.continueBrowsing}</button>}</div></>}
    {phase === "recovery" && <><span className="eyebrow">{copy.onboardingEyebrow}</span><h2 ref={heading} tabIndex={-1}>{copy.tracksRecoveryTitle}</h2><p>{copy.tracksRecoveryDescription}</p>{unavailableContent}<button className="button primary" type="button" onClick={() => { setOnboarding(true); setPhase("edit"); }}>{copy.tracksRecoveryAction}</button></>}
    {phase === "success" && <><h2 ref={heading} tabIndex={-1}>{copy.tracksSaved}</h2><button className="button primary" type="button" onClick={() => setPhase("done")}>{copy.tracksContinue}</button></>}
    {phase === "edit" && <form onSubmit={submit} noValidate>
      <span className="eyebrow">{copy.onboardingEyebrow}</span>
      <h2 ref={heading} tabIndex={-1}>{onboarding ? copy.onboardingTitle : copy.myTracksTitle}</h2>
      <p>{onboarding ? copy.onboardingDescription : copy.myTracksDescription}</p>
      {!tracks.length ? <div className="empty-state"><h3>{copy.noActiveTracksTitle}</h3><p>{copy.noActiveTracksDescription}</p></div> : <>
        <fieldset className="track-options"><legend>{copy.tracksLegend}</legend>{tracks.map((track) => <label key={track.id}><input type="checkbox" checked={selected.includes(track.id)} onChange={() => toggle(track.id)} /> <span>{track.name}</span></label>)}</fieldset>
        <fieldset className="track-options"><legend>{copy.defaultTrackLegend}</legend><p className="field-hint">{copy.defaultTrackHint}</p>{tracks.filter((track) => selected.includes(track.id)).map((track) => <label key={track.id}><input type="radio" name="default-track" value={track.id} checked={defaultTrack === track.id} onChange={() => { setDefaultTrack(track.id); setValidation(""); setSaved(false); }} /> <span>{track.name}</span></label>)}</fieldset>
      </>}
      {unavailableContent}
      {validation && <p className="form-error" role="alert">{validation}</p>}
      {saved && <p className="form-success" role="status">{copy.tracksSaved}</p>}
      <div className="actions">{tracks.length > 0 && <button className="button primary" type="submit">{copy.tracksSave}</button>}{mode === "gate" && onboarding && <button className="button" type="button" onClick={() => setPhase("done")}>{copy.continueBrowsing}</button>}</div>
    </form>}
  </div>;

  return mode === "gate" ? <div ref={overlay} className="track-preferences-overlay" role="dialog" aria-modal="true" aria-label={copy.onboardingTitle} onKeyDown={trapFocus}>{content}</div> : content;
}
