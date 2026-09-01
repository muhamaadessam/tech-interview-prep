"use client";

import { useAuth } from "@clerk/react";
import { useEffect, useState } from "react";

import { formatNumber, messages, type Locale } from "../../i18n";
import { submitQuestion, SubmissionError, type SubmissionResult } from "../../submissions/api";
import { ActiveTrackSelector, useActiveTrack } from "../active-track";
import { AuthDialogTrigger } from "../auth-dialog";
import { LoadingPlaceholder } from "../loading-placeholder";

type TopicOption = { id: string; trackId: string; name: string; questionCount: number };

export function SubmissionForm({ locale, topics, clerkEnabled }: { locale: Locale; topics: TopicOption[]; clerkEnabled: boolean }) {
  if (!clerkEnabled) return <p className="empty-state">{locale === "ar" ? "إرسال الأسئلة يحتاج إعداد تسجيل الدخول أولًا." : "Question submissions require authentication setup first."}</p>;
  return <AuthenticatedSubmissionForm locale={locale} topics={topics} />;
}

function AuthenticatedSubmissionForm({ locale, topics }: { locale: Locale; topics: TopicOption[] }) {
  const copy = messages[locale];
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { phase, activeTrack, selectableTracks, setActiveTrack } = useActiveTrack();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ question: "", shortAnswer: "", explanation: "", difficulty: "", sources: "", codeExample: "", commonMistakes: "", followUpQuestions: "", displayName: "", licenseConsent: false, idempotencyKey: "" });

  useEffect(() => setSelectedTopics([]), [activeTrack?.id]);

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleTopic(id: string) {
    setSelectedTopics((current) => current.includes(id) ? current.filter((topic) => topic !== id) : [...current, id]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult({ submissionId: "", status: "pending" });
    try {
      const idempotencyKey = form.idempotencyKey || crypto.randomUUID();
      if (!form.idempotencyKey) update("idempotencyKey", idempotencyKey);
      const response = await submitQuestion({
        getToken,
        draft: {
          trackId: activeTrack?.id ?? "",
          topicIds: selectedTopics,
          question: form.question,
          shortAnswer: form.shortAnswer,
          explanation: form.explanation,
          difficulty: (form.difficulty || null) as "Junior" | "Mid" | "Senior" | null,
          sources: form.sources.split("\n").map((source) => source.trim()).filter(Boolean),
          codeExample: form.codeExample || undefined,
          commonMistakes: form.commonMistakes.split("\n").map((item) => item.trim()).filter(Boolean),
          followUpQuestions: form.followUpQuestions.split("\n").map((item) => item.trim()).filter(Boolean),
          displayName: form.displayName || undefined,
          licenseConsent: form.licenseConsent,
          idempotencyKey,
        },
      });
      setResult(response);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof SubmissionError ? caught.code : "submission_unavailable");
    }
  }

  if (!isLoaded) return <LoadingPlaceholder variant="form" />;
  if (!isSignedIn) return <div className="empty-state"><h2>{copy.submitSignInRequired}</h2><AuthDialogTrigger locale={locale} className="button primary">{copy.signIn}</AuthDialogTrigger></div>;
  if (phase !== "ready" || !activeTrack) return <ActiveTrackSelector locale={locale} />;

  const trackTopics = topics.filter((topic) => topic.trackId === activeTrack.id);

  return (
    <form className="submission-form" onSubmit={submit}>
      <div className="submission-grid">
        <label>{copy.submitTrack}<select value={activeTrack.id} onChange={(event) => setActiveTrack(event.target.value)}>{selectableTracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}</select></label>
        <fieldset className="submission-topics"><legend>{copy.submitTopics}<span className="topic-count" aria-live="polite">{selectedTopics.length} {copy.selected}</span></legend><div className="topic-options">{trackTopics.map((topic) => { const selected = selectedTopics.includes(topic.id); return <label className="topic-option" key={topic.id}><input className="sr-only" type="checkbox" checked={selected} onChange={() => toggleTopic(topic.id)} /><span className="topic-option-copy"><strong>{topic.name}</strong><small>{formatNumber(topic.questionCount, locale)} {copy.available}</small></span><span className="topic-option-mark" aria-hidden="true">{selected ? "✓" : "+"}</span></label>; })}</div></fieldset>
        <label>{copy.submitQuestion}<textarea required maxLength={500} value={form.question} onChange={(event) => update("question", event.target.value)} /></label>
        <label>{copy.submitShortAnswer}<textarea maxLength={1000} value={form.shortAnswer} onChange={(event) => update("shortAnswer", event.target.value)} /></label>
        <label>{copy.submitExplanation}<textarea maxLength={5000} value={form.explanation} onChange={(event) => update("explanation", event.target.value)} /></label>
        <label>{copy.submitDifficulty}<select value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)}><option value="">{copy.submitDifficultyNone}</option><option>Junior</option><option>Mid</option><option>Senior</option></select></label>
        <label>{copy.submitSources}<span className="field-hint">{copy.submitSourcesHint}</span><textarea placeholder="https://..." value={form.sources} onChange={(event) => update("sources", event.target.value)} /></label>
        <label>{copy.submitCode}<textarea maxLength={10000} value={form.codeExample} onChange={(event) => update("codeExample", event.target.value)} /></label>
        <label>{copy.submitMistakes}<textarea value={form.commonMistakes} onChange={(event) => update("commonMistakes", event.target.value)} /></label>
        <label>{copy.submitFollowups}<textarea value={form.followUpQuestions} onChange={(event) => update("followUpQuestions", event.target.value)} /></label>
        <label>{copy.submitDisplayName}<input maxLength={80} value={form.displayName} onChange={(event) => update("displayName", event.target.value)} /></label>
      </div>
      <label className="consent-checkbox"><input type="checkbox" checked={form.licenseConsent} onChange={(event) => update("licenseConsent", event.target.checked)} required />{copy.submitConsent}</label>
      {error && <p className="form-error" role="alert">{errorMessage(error, copy)}</p>}
      {result?.status === "pending" && <div className="form-success" role="status"><p>{locale === "ar" ? "تم حفظ المساهمة وإرسالها للمراجعة." : "Contribution saved and sent for review."}</p></div>}
      {result?.status === "failed" && <p className="form-error" role="alert">{copy.submitFailed} <button className="text-button" type="submit">{copy.submitRetry}</button></p>}
      <button className="button primary" type="submit" disabled={result?.status === "approved"}>{result?.status === "pending" && !result.submissionId ? copy.submitSubmitting : copy.submitButton}</button>
    </form>
  );
}

function errorMessage(code: string, copy: typeof messages.ar | typeof messages.en): string {
  if (code === "daily_limit_reached") return copy.submitRateLimit;
  if (code === "cooldown_active") return copy.submitCooldown;
  if (code === "submission_suspended") return copy.submitSuspended;
  if (code === "track_preference_required") return copy.submitTrackPreference;
  if (code === "topics_invalid" || code === "taxonomy_invalid" || code.endsWith("_invalid") || code === "license_consent_required") return copy.submitValidation;
  return copy.submitUnavailable;
}
