"use client";

import { SignInButton, useAuth, useUser } from "@clerk/react";
import { useState } from "react";

import { messages, type Locale } from "../../i18n";
import { submitQuestion, SubmissionError, type SubmissionResult } from "../../submissions/api";

type TopicOption = { id: string; name: string };

export function SubmissionForm({ locale, topics, clerkEnabled }: { locale: Locale; topics: TopicOption[]; clerkEnabled: boolean }) {
  if (!clerkEnabled) return <p className="empty-state">{locale === "ar" ? "إرسال الأسئلة يحتاج إعداد تسجيل الدخول أولًا." : "Question submissions require authentication setup first."}</p>;
  return <AuthenticatedSubmissionForm locale={locale} topics={topics} />;
}

function AuthenticatedSubmissionForm({ locale, topics }: { locale: Locale; topics: TopicOption[] }) {
  const copy = messages[locale];
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ question: "", shortAnswer: "", explanation: "", difficulty: "Junior", sources: "", codeExample: "", commonMistakes: "", followUpQuestions: "", displayName: "", licenseConsent: false, idempotencyKey: "" });
  const verified = user?.primaryEmailAddress?.verification?.status === "verified";

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
          trackId: "flutter",
          topicIds: selectedTopics,
          question: form.question,
          shortAnswer: form.shortAnswer,
          explanation: form.explanation,
          difficulty: form.difficulty as "Junior" | "Mid" | "Senior",
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

  if (!isLoaded) return <p className="empty-state">{copy.submitLoading}</p>;
  if (!isSignedIn) return <div className="empty-state"><h2>{copy.submitSignInRequired}</h2><SignInButton mode="modal"><button className="button primary" type="button">{copy.signIn}</button></SignInButton></div>;
  if (!verified) return <p className="empty-state">{copy.submitEmailRequired}</p>;

  return (
    <form className="submission-form" onSubmit={submit}>
      <div className="submission-grid">
        <label>{copy.submitTrack}<select value="flutter" disabled><option value="flutter">Flutter</option></select></label>
        <fieldset className="submission-topics"><legend>{copy.submitTopics}</legend><div className="topic-options">{topics.map((topic) => <label key={topic.id}><input type="checkbox" checked={selectedTopics.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />{topic.name}</label>)}</div></fieldset>
        <label>{copy.submitQuestion}<textarea required maxLength={500} value={form.question} onChange={(event) => update("question", event.target.value)} /></label>
        <label>{copy.submitShortAnswer}<textarea required maxLength={1000} value={form.shortAnswer} onChange={(event) => update("shortAnswer", event.target.value)} /></label>
        <label>{copy.submitExplanation}<textarea required maxLength={5000} value={form.explanation} onChange={(event) => update("explanation", event.target.value)} /></label>
        <label>{copy.submitDifficulty}<select value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)}><option>Junior</option><option>Mid</option><option>Senior</option></select></label>
        <label>{copy.submitSources}<span className="field-hint">{copy.submitSourcesHint}</span><textarea required placeholder="https://..." value={form.sources} onChange={(event) => update("sources", event.target.value)} /></label>
        <label>{copy.submitCode}<textarea maxLength={10000} value={form.codeExample} onChange={(event) => update("codeExample", event.target.value)} /></label>
        <label>{copy.submitMistakes}<textarea value={form.commonMistakes} onChange={(event) => update("commonMistakes", event.target.value)} /></label>
        <label>{copy.submitFollowups}<textarea value={form.followUpQuestions} onChange={(event) => update("followUpQuestions", event.target.value)} /></label>
        <label>{copy.submitDisplayName}<input maxLength={80} value={form.displayName} onChange={(event) => update("displayName", event.target.value)} /></label>
      </div>
      <label className="consent-checkbox"><input type="checkbox" checked={form.licenseConsent} onChange={(event) => update("licenseConsent", event.target.checked)} required />{copy.submitConsent}</label>
      {error && <p className="form-error" role="alert">{errorMessage(error, copy)}</p>}
      {result?.status === "pending" && result.submissionId && <p className="form-status">{copy.submitPending}</p>}
      {result?.status === "issue_created" && <p className="form-success" role="status">{copy.submitSuccess} {result.githubIssueUrl && <a href={result.githubIssueUrl} target="_blank" rel="noreferrer">{copy.submitSuccessIssue}</a>}{result.duplicateAdvisory ? ` — ${copy.submitDuplicate}` : ""}</p>}
      {result?.status === "failed" && <p className="form-error" role="alert">{copy.submitFailed} <button className="text-button" type="submit">{copy.submitRetry}</button></p>}
      <button className="button primary" type="submit" disabled={result?.status === "pending" && !result.submissionId}>{result?.status === "pending" && !result.submissionId ? copy.submitSubmitting : copy.submitButton}</button>
    </form>
  );
}

function errorMessage(code: string, copy: typeof messages.ar | typeof messages.en): string {
  if (code === "daily_limit_reached") return copy.submitRateLimit;
  if (code === "cooldown_active") return copy.submitCooldown;
  if (code === "email_confirmation_required") return copy.submitEmailRequired;
  if (code === "topics_invalid" || code === "taxonomy_invalid" || code.endsWith("_invalid") || code === "license_consent_required") return copy.submitValidation;
  return copy.submitUnavailable;
}
