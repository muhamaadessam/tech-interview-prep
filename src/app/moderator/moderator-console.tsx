"use client";

import { useAuth } from "@clerk/react";
import { useCallback, useEffect, useState } from "react";

import { messages, type Locale } from "../../i18n";
import { hasModeratorAccess, ModerationError, moderationRequest, type ModerationStatus, type ModerationSubmission } from "../../moderation/api";
import { AuthDialogTrigger } from "../auth-dialog";
import { LoadingPlaceholder } from "../loading-placeholder";

const statuses: ModerationStatus[] = ["pending", "in_review", "changes_requested", "approved"];

export function ModeratorConsole({ locale, clerkEnabled }: { locale: Locale; clerkEnabled: boolean }) {
  if (!clerkEnabled) return <p className="empty-state">{locale === "ar" ? "لوحة المشرف تحتاج إعداد تسجيل الدخول." : "The moderator console needs authentication setup."}</p>;
  return <AuthenticatedModeratorConsole locale={locale} />;
}

function AuthenticatedModeratorConsole({ locale }: { locale: Locale }) {
  const copy = messages[locale];
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState<ModerationStatus>("pending");
  const [moderatorAccess, setModeratorAccess] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ModerationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedPromptId, setCopiedPromptId] = useState("");
  const [importSubmissionId, setImportSubmissionId] = useState("");
  const [importDocument, setImportDocument] = useState("");
  const [importPreview, setImportPreview] = useState<unknown>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [questionIds, setQuestionIds] = useState<Record<string, string>>({});
  const [communityMode, setCommunityMode] = useState(false);
  const [followUpMode, setFollowUpMode] = useState(false);
  const [followUpSources, setFollowUpSources] = useState<Array<{ id: string; slug: string; track_id: string; target_ids: string[] }>>([]);
  const [followUpTargets, setFollowUpTargets] = useState<Array<{ id: string; slug: string; track_id: string }>>([]);
  const [followUpSourceId, setFollowUpSourceId] = useState("");
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [communityRows, setCommunityRows] = useState<Array<{ id: string; slug: string; track_id: string; visibility: string; promoted_at: string | null; community_published_at: string | null; community_unpublished_at: string | null; promotion_like_count: number | null; community_contributor_username: string | null }>>([]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await moderationRequest<{ submissions: ModerationSubmission[] }>({ getToken, body: { action: "list_submissions", status } });
      setRows(response.submissions ?? []);
    } catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
    finally { setLoading(false); }
  }, [getToken, status]);

  useEffect(() => {
    if (!isSignedIn) { setModeratorAccess(false); return; }
    let active = true;
    void hasModeratorAccess({ userId: "page-access-check", getToken }).then((allowed) => { if (active) setModeratorAccess(allowed); });
    return () => { active = false; };
  }, [getToken, isSignedIn]);
  useEffect(() => { if (moderatorAccess === true) void load(); }, [load, moderatorAccess]);

  async function loadCommunity() {
    setCommunityMode(true); setFollowUpMode(false); setLoading(true); setError("");
    try { const response = await moderationRequest<{ questions: typeof communityRows }>({ getToken, body: { action: "list_community_questions" } }); setCommunityRows(response.questions ?? []); }
    catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
    finally { setLoading(false); }
  }

  async function loadFollowUps() {
    setFollowUpMode(true); setCommunityMode(false); setLoading(true); setError("");
    try {
      const result = await moderationRequest<{ sources: typeof followUpSources; targets: typeof followUpTargets }>({ getToken, body: { action: "list_follow_up_editor" } });
      setFollowUpSources(result.sources ?? []); setFollowUpTargets(result.targets ?? []); setFollowUpSourceId(result.sources?.[0]?.id ?? "");
    } catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
    finally { setLoading(false); }
  }

  async function saveFollowUps() {
    const source = followUpSources.find((item) => item.id === followUpSourceId);
    if (!source) return;
    setFollowUpSaving(true); setError("");
    try {
      const result = await moderationRequest({ getToken, body: { action: "save_follow_ups", questionId: source.id, targetQuestionIds: source.target_ids } });
      setFollowUpSources((current) => current.map((item) => item.id === source.id ? { ...item, target_ids: source.target_ids } : item));
      if (!result) throw new Error("moderation_unavailable");
    } catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
    finally { setFollowUpSaving(false); }
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


  async function publish(submissionId: string) {
    const questionId = questionIds[submissionId]?.trim();
    if (!questionId) return;
    setError("");
    try { await moderationRequest({ getToken, body: { action: "publish_submission", submissionId, questionId } }); await load(); }
    catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
  }

  async function importQuestion(mode: "preview" | "confirm") {
    if (!importSubmissionId || !importDocument.trim()) return;
    setError("");
    try {
      const result = await moderationRequest<{ question?: unknown }>({ getToken, body: { action: "import_submission", mode, submissionId: importSubmissionId, document: importDocument } });
      if (mode === "preview") setImportPreview(result.question ?? null); else { setImportPreview(null); setImportDocument(""); await load(); }
    } catch (caught) { setError(caught instanceof ModerationError ? caught.code : "moderation_unavailable"); }
  }

  async function copyPrompt(id: string, prompt: string) {
    try { await navigator.clipboard.writeText(prompt); setCopiedPromptId(id); }
    catch { setError(locale === "ar" ? "تعذر نسخ الـPrompt." : "Could not copy the prompt."); }
  }

  if (!isLoaded) return <LoadingPlaceholder variant="moderator" />;
  if (!isSignedIn) return <div className="empty-state"><h2>{copy.moderatorSignIn}</h2><AuthDialogTrigger locale={locale} className="button primary">{copy.signIn}</AuthDialogTrigger></div>;
  if (moderatorAccess === null) return <LoadingPlaceholder variant="moderator" />;
  if (!moderatorAccess) return <div className="empty-state"><h2>{locale === "ar" ? "لوحة المشرف غير متاحة" : "Moderator access required"}</h2><p>{locale === "ar" ? "هذا الحساب ليس لديه صلاحية مراجعة المساهمات." : "This account is not allowed to review contributions."}</p></div>;

  return <div className="moderator-console">
    <div className="moderator-toolbar"><label>{copy.moderatorStatus}<select value={status} onChange={(event) => { setCommunityMode(false); setFollowUpMode(false); setStatus(event.target.value as ModerationStatus); }}>{statuses.map((value) => <option key={value} value={value}>{statusLabel(value, locale)}</option>)}</select></label><button className="button" type="button" onClick={() => void (followUpMode ? loadFollowUps() : communityMode ? loadCommunity() : load())} disabled={loading}>{loading ? copy.moderatorLoading : copy.moderatorRefresh}</button><button className="button" type="button" onClick={() => void loadCommunity()} disabled={loading}>{locale === "ar" ? "أسئلة المجتمع" : "Community questions"}</button><button className="button" type="button" onClick={() => void loadFollowUps()} disabled={loading}>{locale === "ar" ? "أسئلة المتابعة" : "Follow-ups"}</button></div>
    {!communityMode && !followUpMode && <section className="card moderator-card"><h2>{locale === "ar" ? "استيراد JSON من AI" : "Import AI JSON"}</h2><label>{locale === "ar" ? "معرّف المساهمة" : "Submission ID"}<input value={importSubmissionId} onChange={(event) => setImportSubmissionId(event.target.value)} /></label><label>{locale === "ar" ? "ملف JSON" : "JSON document"}<textarea value={importDocument} onChange={(event) => setImportDocument(event.target.value)} rows={8} /></label><div className="actions"><button className="button" type="button" onClick={() => void importQuestion("preview")}>{locale === "ar" ? "معاينة" : "Preview"}</button><button className="button primary" type="button" onClick={() => void importQuestion("confirm")} disabled={!importPreview}>{locale === "ar" ? "تأكيد وإضافة" : "Confirm and add"}</button></div>{importPreview !== null && <pre className="field-hint">{JSON.stringify(importPreview, null, 2) ?? ""}</pre>}</section>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {!communityMode && !followUpMode && !loading && !rows.length && <p className="empty-state">{copy.moderatorEmpty}</p>}
    {followUpMode ? loading ? <LoadingPlaceholder variant="moderator" /> : <FollowUpEditor locale={locale} sources={followUpSources} targets={followUpTargets} sourceId={followUpSourceId} onSourceChange={setFollowUpSourceId} onTargetsChange={(targetIds) => setFollowUpSources((current) => current.map((item) => item.id === followUpSourceId ? { ...item, target_ids: targetIds } : item))} onSave={() => void saveFollowUps()} saving={followUpSaving} /> : communityMode ? loading ? <LoadingPlaceholder variant="moderator" /> : <div className="moderator-list">{communityRows.map((row) => <article className="card moderator-card" key={row.id}><div className="meta"><span className="chip">{row.visibility}</span><span className="chip">{row.track_id}</span>{row.promoted_at && <span className="chip">{copy.promoted}</span>}</div><h2>{row.slug}</h2><p>{row.community_contributor_username ? `@${row.community_contributor_username}` : copy.contributor}</p><p className="field-hint">{row.community_published_at ?? "—"}{row.promotion_like_count ? ` · ${row.promotion_like_count} ${copy.likes}` : ""}</p><label>{copy.moderatorReason}<textarea value={reason[row.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [row.id]: event.target.value }))} maxLength={500} /></label><div className="actions">{row.community_unpublished_at ? <button className="button" type="button" onClick={() => void moderateCommunity(row.id, "republish_question")}>{locale === "ar" ? "إعادة النشر" : "Republish"}</button> : <button className="button danger" type="button" onClick={() => void moderateCommunity(row.id, "unpublish_question")}>{locale === "ar" ? "إخفاء" : "Unpublish"}</button>}</div></article>)}</div> : loading ? <LoadingPlaceholder variant="moderator" /> : <div className="moderator-list">{rows.map((row) => <article className="card moderator-card" key={row.id}>
      <div className="meta"><span className="chip">{row.difficulty}</span><span className="chip">{statusLabel(row.status, locale)}</span></div>
      <h2>{row.payload.question ?? "—"}</h2><p>{row.payload.shortAnswer ?? ""}</p>
      {row.prompt && <div className="moderator-prompt"><label>{locale === "ar" ? "Prompt مراجعة السؤال بالـAI" : "AI question review prompt"}<textarea readOnly value={row.prompt} rows={12} /></label><button className="button" type="button" onClick={() => void copyPrompt(row.id, row.prompt ?? "")}>{copiedPromptId === row.id ? (locale === "ar" ? "تم النسخ" : "Copied") : (locale === "ar" ? "نسخ الـPrompt" : "Copy prompt")}</button></div>}
      {row.review_notes && <p className="field-hint">{row.review_notes}</p>}
      <label>{copy.moderatorReason}<textarea value={reason[row.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [row.id]: event.target.value }))} maxLength={500} /></label>
      {row.status === "approved" && <label>{locale === "ar" ? "معرّف السؤال المنشور" : "Published question ID"}<input value={questionIds[row.id] ?? ""} onChange={(event) => setQuestionIds((current) => ({ ...current, [row.id]: event.target.value }))} placeholder="question-id" /></label>}
      <div className="actions"><button className="button" type="button" onClick={() => void act(row.id, "changes_requested")}>{copy.moderatorChanges}</button><button className="button danger" type="button" onClick={() => void act(row.id, "reject_submission")}>{copy.moderatorReject}</button>{row.status === "approved" && <button className="button primary" type="button" onClick={() => void publish(row.id)}>{locale === "ar" ? "نشر في المجتمع" : "Publish to community"}</button>}</div>
    </article>)}</div>}
  </div>;
}

function statusLabel(status: ModerationStatus, locale: Locale): string {
  const labels = { ar: { pending: "قيد الانتظار", in_review: "قيد المراجعة", changes_requested: "مطلوب تعديل", approved: "مقبول", rejected: "مرفوض", published: "منشور", failed: "فشل" }, en: { pending: "Pending", in_review: "In review", changes_requested: "Changes requested", approved: "Approved", rejected: "Rejected", published: "Published", failed: "Failed" } } as const;
  return labels[locale][status];
}

function FollowUpEditor({ locale, sources, targets, sourceId, onSourceChange, onTargetsChange, onSave, saving }: { locale: Locale; sources: Array<{ id: string; slug: string; track_id: string; target_ids: string[] }>; targets: Array<{ id: string; slug: string; track_id: string }>; sourceId: string; onSourceChange: (id: string) => void; onTargetsChange: (ids: string[]) => void; onSave: () => void; saving: boolean }) {
  const source = sources.find((item) => item.id === sourceId);
  if (!source) return <p className="empty-state">{locale === "ar" ? "لا توجد أسئلة منشورة." : "No published questions found."}</p>;
  const sameTrack = targets.filter((target) => target.track_id === source.track_id && target.id !== source.id);
  return <article className="card moderator-card follow-up-editor">
    <label>{locale === "ar" ? "السؤال المصدر" : "Source question"}<select value={source.id} onChange={(event) => onSourceChange(event.target.value)}>{sources.map((item) => <option key={item.id} value={item.id}>{item.slug} · {item.track_id}</option>)}</select></label>
    <fieldset><legend>{locale === "ar" ? "أسئلة المتابعة بالترتيب" : "Follow-up questions in order"}</legend>{sameTrack.map((target) => <label key={target.id} className="filter-checkbox"><input type="checkbox" checked={source.target_ids.includes(target.id)} onChange={(event) => onTargetsChange(event.target.checked ? [...source.target_ids, target.id] : source.target_ids.filter((id) => id !== target.id))} />{target.slug}</label>)}</fieldset>
    <button className="button primary" type="button" onClick={onSave} disabled={saving}>{saving ? (locale === "ar" ? "جاري الحفظ…" : "Saving…") : (locale === "ar" ? "حفظ ونشر النسخة" : "Save and publish revision")}</button>
  </article>;
}
