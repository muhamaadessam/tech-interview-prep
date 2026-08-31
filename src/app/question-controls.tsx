"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/react";

import {
  defaultQuestionState,
  getSavedQuestions,
  questionProgressOptions,
  type SavedQuestionState,
  saveQuestionState,
} from "../study/progress";
import { messages } from "../i18n";
import type { Locale } from "../content/questions";
import { AuthDialogTrigger } from "./auth-dialog";
import { adjustAskedMarker, loadAskedMarkerStates, type AskedMarkerState } from "../study/asked-markers";
import { formatNumber } from "../i18n";

type AuthState = { authLoaded: boolean; isSignedIn: boolean | undefined; userId: string | null | undefined; getToken: ReturnType<typeof useAuth>["getToken"] };
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const anonymousAuth = { authLoaded: true, isSignedIn: false, userId: null, getToken: (async () => null) as AuthState["getToken"] } satisfies AuthState;

export function QuestionControls({ questionId, locale = "ar" }: { questionId: string; locale?: Locale }) {
  if (!clerkEnabled) return <QuestionControlsContent questionId={questionId} locale={locale} auth={anonymousAuth} clerkEnabled={false} />;
  return <AuthenticatedQuestionControls questionId={questionId} locale={locale} />;
}

function AuthenticatedQuestionControls({ questionId, locale }: { questionId: string; locale: Locale }) {
  const { isLoaded: authLoaded, isSignedIn, userId, getToken } = useAuth();
  return <QuestionControlsContent questionId={questionId} locale={locale} clerkEnabled auth={{ authLoaded, isSignedIn, userId, getToken }} />;
}

function QuestionControlsContent({ questionId, locale = "ar", auth, clerkEnabled }: { questionId: string; locale?: Locale; auth: AuthState; clerkEnabled: boolean }) {
  const { authLoaded, isSignedIn, userId, getToken } = auth;
  const [questionState, setQuestionState] = useState<SavedQuestionState>(defaultQuestionState);
  const [saveStatus, setSaveStatus] = useState("");
  const [asked, setAsked] = useState<AskedMarkerState>({ personalCount: null, interviewFrequency: 0 });
  const [askedLoading, setAskedLoading] = useState(true);
  const [askedBusy, setAskedBusy] = useState(false);
  const [askedError, setAskedError] = useState("");
  const [askedAvailable, setAskedAvailable] = useState(true);

  useEffect(() => {
    const load = () => {
      const saved = getSavedQuestions(localStorage)[questionId];
      setQuestionState(saved ?? defaultQuestionState);
    };
    load();
    window.addEventListener("study-state-merged", load);
    return () => window.removeEventListener("study-state-merged", load);
  }, [questionId]);

  useEffect(() => {
    if (!authLoaded) return;
    let current = true;
    setAskedLoading(true);
    setAskedAvailable(true);
    loadAskedMarkerStates({ questionIds: [questionId], userId, getToken }).then((states) => {
      if (current) setAsked(states[questionId] ?? { personalCount: isSignedIn ? 0 : null, interviewFrequency: 0 });
    }).catch(() => { if (current) { setAskedAvailable(false); setAskedError(""); } }).finally(() => { if (current) setAskedLoading(false); });
    return () => { current = false; };
  }, [authLoaded, getToken, isSignedIn, locale, questionId, userId]);

  function update(patch: Partial<SavedQuestionState>) {
    saveQuestionState(localStorage, questionId, patch);
    setQuestionState((current) => ({ ...current, ...patch }));
    window.dispatchEvent(new Event("study-state-change"));
    setSaveStatus(messages[locale].saved);
  }

  async function changeAsked(delta: -1 | 1) {
    if (!isSignedIn || askedBusy) return;
    setAskedBusy(true); setAskedError("");
    try { setAsked(await adjustAskedMarker({ questionId, delta, getToken })); }
    catch { setAskedError(messages[locale].askedMarkerUnavailable); }
    finally { setAskedBusy(false); }
  }

  return (
    <div className="question-controls">
      <span className="sr-only" aria-live="polite">{saveStatus}</span>
      <fieldset>
        <legend>{messages[locale].progressLegend}</legend>
        {questionProgressOptions.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={`progress-${questionId}`}
              value={option.value}
              checked={questionState.progress === option.value}
              onChange={() => update({ progress: option.value })}
            />
            {option.value === "not-started" ? (locale === "ar" ? "لم أبدأ" : "Not started") : option.value === "reviewing" ? messages[locale].reviewing : messages[locale].mastered}
          </label>
        ))}
      </fieldset>
      <label className="favorite-control">
        <input
          type="checkbox"
          checked={questionState.favorite}
          onChange={(event) => update({ favorite: event.target.checked })}
        />
        {messages[locale].favorite}
      </label>
      {askedAvailable ? <div className="asked-marker" aria-live="polite">
        <div className="asked-marker-summary"><span>{messages[locale].interviewFrequency}: {askedLoading ? "…" : formatNumber(asked.interviewFrequency, locale)}</span>{isSignedIn ? <span>{messages[locale].askedMarker}: {askedLoading ? "…" : formatNumber(asked.personalCount ?? 0, locale)}</span> : null}</div>
        {isSignedIn ? <div className="asked-marker-actions"><button className="button icon-control" type="button" onClick={() => void changeAsked(-1)} disabled={askedBusy || askedLoading || !asked.personalCount} aria-label={`${messages[locale].decreaseAsked} (${asked.personalCount ?? 0})`}>−</button><button className="button icon-control" type="button" onClick={() => void changeAsked(1)} disabled={askedBusy || askedLoading} aria-label={`${messages[locale].increaseAsked} (${asked.personalCount ?? 0})`}>+</button></div> : clerkEnabled ? <AuthDialogTrigger locale={locale} className="text-link">{messages[locale].signInToMarkAsked}</AuthDialogTrigger> : null}
        {askedError && <p className="form-error" role="alert">{askedError}</p>}
      </div> : null}
    </div>
  );
}

export function AnswerDisclosure({ children, locale = "ar" }: { children: ReactNode; locale?: Locale }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="answer">
      <button
        className="answer-toggle"
        type="button"
        aria-expanded={revealed}
        aria-controls="question-answer"
        onClick={() => setRevealed((current) => !current)}
      >
        {revealed ? messages[locale].hide : messages[locale].reveal}
      </button>
      {revealed ? <div className="answer-content" id="question-answer">{children}</div> : null}
    </div>
  );
}
