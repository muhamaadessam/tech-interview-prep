"use client";

import { useAuth } from "@clerk/react";
import { useCallback, useEffect, useState } from "react";

import { messages, type Locale } from "../../i18n";
import { AdvisoryError, runAdvisory } from "../../advisory/api";
import { ModerationError, moderationRequest, type ModerationStatus, type ModerationSubmission } from "../../moderation/api";
import { AuthDialogTrigger } from "../auth-dialog";
import { LoadingPlaceholder } from "../loading-placeholder";

const statuses: ModerationStatus[] = ["pending", "issue_created", "in_review", "changes_requested", "approved"];

export function ModeratorConsole({ locale, clerkEnabled }: { locale: Locale; clerkEnabled: boolean }) {
  if (!clerkEnabled) return <p className="empty-state">{locale === "ar" ? "لوحة المشرف تحتاج إعداد تسجيل الدخول." : "The moderator console needs authentication setup."}</p>;
  return <AuthenticatedModeratorConsole locale={locale} />;
}

function AuthenticatedModeratorConsole({ locale }: { locale: Locale }) {
  const copy = messages[locale];
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState<ModerationStatus>("pending");
  const [rows, setRows] = useState<ModerationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [advisory, setAdvisory] = useState<Record<string, string>>({});
  const [questionIds, setQuestionIds] = useState<Record<string, string>>({});
  const [communityMode, setCommunityMode] = useState(false);
  const [communityRows, setCommunityRows] = useState<Array<{ id: string; slug: string; visibility: string; promoted_at: string | null; community_contributor_username: string | null }>>([]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await moderationRequest<{ submissions: ModerationSubmission[] }>({ getToken, body: { action: "list_submissions", status } });
      setRows(response.submissions ?? []);
    } catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
    finally { setLoading(false); }
  }, [getToken, status]);

  useEffect(() => { if (isSignedIn) void load(); }, [isSignedIn, load]);

  async function loadCommunity() {
    setCommunityMode(true); setLoading(true); setError("");
    try { const response = await moderationRequest<{ questions: typeof communityRows }>({ getToken, body: { action: "list_community_questions" } }); setCommunityRows(response.questions ?? []); }
    catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
    finally { setLoading(false); }
  }

  async function moderateCommunity(questionId: string, action: "unpublish_question" | "republish_question") {
    const note = reason[questionId]?.trim();
    if (action === "unpublish_question" && !note) return;
    try { await moderationRequest({ getToken, body: { action, questionId, ...(note ? { reason: note } : {}) } }); await loadCommunity(); }
    catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
  }

  async function act(submissionId: string, action: "changes_requested" | "reject_submission") {
    const note = reason[submissionId]?.trim();
    if (!note) return;
    setError("");
    try { await moderationRequest({ getToken, body: { action, submissionId, reason: note } }); setReason((current) => ({ ...current, [submissionId]: "" })); await load(); }
    catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
  }

  async function reviewWithAi(submissionId: string) {
    setAdvisory((current) => ({ ...current, [submissionId]: "running" }));
    try { const result = await runAdvisory({ getToken, submissionId }); setAdvisory((current) => ({ ...current, [submissionId]: result.status })); }
    catch (caught) { setAdvisory((current) => ({ ...current, [submissionId]: "failed" })); setError(caught instanceof AdvisoryError ? caught.code : "advisory_unavailable"); }
  }

  async function publish(submissionId: string) {
    const questionId = questionIds[submissionId]?.trim();
    if (!questionId) return;
    setError("");
    try { await moderationRequest({ getToken, body: { action: "publish_submission", submissionId, questionId } }); await load(); }
    catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
  }

  if (!isLoaded) return <LoadingPlaceholder variant="moderator" />;
  if (!isSignedIn) return <div className="empty-state"><h2>{copy.moderatorSignIn}</h2><AuthDialogTrigger locale={locale} className="button primary">{copy.signIn}</AuthDialogTrigger></div>;

  return <div className="moderator-console">
    <div className="moderator-toolbar"><label>{copy.moderatorStatus}<select value={status} onChange={(event) => { setCommunityMode(false); setStatus(event.target.value as ModerationStatus); }}>{statuses.map((value) => <option key={value} value={value}>{statusLabel(value, locale)}</option>)}</select></label><button className="button" type="button" onClick={() => void load()} disabled={loading}>{loading ? copy.moderatorLoading : copy.moderatorRefresh}</button><button className="button" type="button" onClick={() => void loadCommunity()} disabled={loading}>{locale === "ar" ? "أسئلة المجتمع" : "Community questions"}</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!communityMode && !loading && !rows.length && <p className="empty-state">{copy.moderatorEmpty}</p>}
    {communityMode ? loading ? <LoadingPlaceholder variant="moderator" /> : <div className="moderator-list">{communityRows.map((row) => <article className="card moderator-card" key={row.id}><div className="meta"><span className="chip">{row.visibility}</span>{row.promoted_at && <span className="chip">{copy.promoted}</span>}</div><h2>{row.slug}</h2><p>{row.community_contributor_username ? `@${row.community_contributor_username}` : copy.contributor}</p><label>{copy.moderatorReason}<textarea value={reason[row.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [row.id]: event.target.value }))} maxLength={500} /></label><div className="actions"><button className="button danger" type="button" onClick={() => void moderateCommunity(row.id, "unpublish_question")}>{locale === "ar" ? "إخفاء" : "Unpublish"}</button><button className="button" type="button" onClick={() => void moderateCommunity(row.id, "republish_question")}>{locale === "ar" ? "إعادة النشر" : "Republish"}</button></div></article>)}</div> : loading ? <LoadingPlaceholder variant="moderator" /> : <div className="moderator-list">{rows.map((row) => <article className="card moderator-card" key={row.id}>
      <div className="meta"><span className="chip">{row.difficulty}</span><span className="chip">{statusLabel(row.status, locale)}</span>{row.github_issue_url && <a className="text-link" href={row.github_issue_url} target="_blank" rel="noreferrer">GitHub #{row.github_issue_number}</a>}</div>
      <h2>{row.payload.question ?? "—"}</h2><p>{row.payload.shortAnswer ?? ""}</p>
      {row.review_notes && <p className="field-hint">{row.review_notes}</p>}
      <label>{copy.moderatorReason}<textarea value={reason[row.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [row.id]: event.target.value }))} maxLength={500} /></label>
      {row.status === "approved" && <label>{locale === "ar" ? "معرّف السؤال المنشور" : "Published question ID"}<input value={questionIds[row.id] ?? ""} onChange={(event) => setQuestionIds((current) => ({ ...current, [row.id]: event.target.value }))} placeholder="question-id" /></label>}
      <div className="actions"><button className="button" type="button" onClick={() => void act(row.id, "changes_requested")}>{copy.moderatorChanges}</button><button className="button danger" type="button" onClick={() => void act(row.id, "reject_submission")}>{copy.moderatorReject}</button>{row.status === "approved" && <button className="button primary" type="button" onClick={() => void publish(row.id)}>{locale === "ar" ? "نشر في المجتمع" : "Publish to community"}</button>}{row.github_issue_number && <button className="button" type="button" onClick={() => void reviewWithAi(row.id)} disabled={advisory[row.id] === "running"}>{advisory[row.id] === "running" ? (locale === "ar" ? "جاري المراجعة…" : "Reviewing…") : (locale === "ar" ? "مراجعة بالذكاء الاصطناعي" : "Run AI advisory review")}</button>}</div>
      {advisory[row.id] === "completed" && <p className="form-status" role="status">{locale === "ar" ? "تمت إضافة المراجعة الاستشارية إلى Issue." : "Advisory review added to the Issue."}</p>}
    </article>)}</div>}
  </div>;
}

function statusLabel(status: ModerationStatus, locale: Locale): string {
  const labels = { ar: { pending: "قيد الانتظار", issue_created: "Issue منشأ", in_review: "قيد المراجعة", changes_requested: "مطلوب تعديل", approved: "مقبول", rejected: "مرفوض", published: "منشور", failed: "فشل" }, en: { pending: "Pending", issue_created: "Issue created", in_review: "In review", changes_requested: "Changes requested", approved: "Approved", rejected: "Rejected", published: "Published", failed: "Failed" } } as const;
  return labels[locale][status];
}
