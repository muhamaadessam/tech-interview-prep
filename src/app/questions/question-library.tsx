"use client";

import Link from "next/link";
import { useAuth } from "@clerk/react";
import { useEffect, useMemo, useState } from "react";
import { filterQuestions, fromSearchParams, toSearchParams, difficultyOptions, type LibraryFilters, type SearchableQuestion } from "../../content/question-search";
import { getSavedQuestions, questionProgressOptions, type SavedQuestions } from "../../study/progress";
import { formatNumber, localizedHref, messages, type Locale } from "../../i18n";
import { scopeCatalogue } from "../../tracks/active-track";
import { loadCommunityQuestions, type CommunityQuestion } from "../../community/catalogue";
import { CommunityLikeError, setQuestionLike } from "../../community/likes";
import { ActiveTrackRecovery, ActiveTrackSelector, useActiveTrack } from "../active-track";
import { AuthDialogTrigger } from "../auth-dialog";
import { LoadingPlaceholder } from "../loading-placeholder";
import { loadAskedMarkerStates, sortByInterviewFrequency, type AskedMarkerStates } from "../../study/asked-markers";

type LibraryTopic = { id: string; slug: string; trackId: string; name: string };
type DisplayQuestion = SearchableQuestion & Partial<Pick<CommunityQuestion, "visibility" | "contributorUsername" | "likeCount" | "promotedAt" | "likedByViewer">> & { database?: boolean };
type AuthState = { authLoaded: boolean; isSignedIn: boolean | undefined; userId: string | null | undefined; getToken: ReturnType<typeof useAuth>["getToken"] };
const emptyFilters: LibraryFilters = { search: "", topic: "", difficulty: "", progress: "", favoriteOnly: false, sort: "default", scope: "public" };
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const anonymousAuth = { authLoaded: true, isSignedIn: false, userId: null, getToken: (async () => null) as AuthState["getToken"] } satisfies AuthState;

export function QuestionLibrary({ questions, topics, locale = "ar" }: { questions: SearchableQuestion[]; topics: LibraryTopic[]; locale?: Locale }) {
  if (!clerkEnabled) return <QuestionLibraryContent questions={questions} topics={topics} locale={locale} auth={anonymousAuth} clerkEnabled={false} />;
  return <AuthenticatedQuestionLibrary questions={questions} topics={topics} locale={locale} />;
}

function AuthenticatedQuestionLibrary({ questions, topics, locale }: { questions: SearchableQuestion[]; topics: LibraryTopic[]; locale: Locale }) {
  const { isLoaded: authLoaded, isSignedIn, userId, getToken } = useAuth();
  return <QuestionLibraryContent questions={questions} topics={topics} locale={locale} clerkEnabled auth={{ authLoaded, isSignedIn, userId, getToken }} />;
}

function QuestionLibraryContent({ questions, topics, locale = "ar", auth, clerkEnabled }: { questions: SearchableQuestion[]; topics: LibraryTopic[]; locale?: Locale; auth: AuthState; clerkEnabled: boolean }) {
  const copy = messages[locale];
  const { authLoaded, isSignedIn, userId, getToken } = auth;
  const [filters, setFilters] = useState<LibraryFilters>(emptyFilters);
  const [saved, setSaved] = useState<SavedQuestions>({});
  const [community, setCommunity] = useState<CommunityQuestion[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState(false);
  const [likeBusy, setLikeBusy] = useState<Record<string, boolean>>({});
  const [likeError, setLikeError] = useState("");
  const [askedStates, setAskedStates] = useState<AskedMarkerStates>({});
  const { phase, activeTrack, invalidTrack, trackHref } = useActiveTrack();

  useEffect(() => {
    function syncFromUrl() { setFilters((current) => ({ ...current, ...fromSearchParams(new URLSearchParams(window.location.search)) })); }
    syncFromUrl();
    const syncSaved = () => setSaved(getSavedQuestions(localStorage));
    syncSaved();
    window.addEventListener("popstate", syncFromUrl); window.addEventListener("urlchange", syncFromUrl); window.addEventListener("study-state-merged", syncSaved); window.addEventListener("study-state-change", syncSaved);
    return () => { window.removeEventListener("popstate", syncFromUrl); window.removeEventListener("urlchange", syncFromUrl); window.removeEventListener("study-state-merged", syncSaved); window.removeEventListener("study-state-change", syncSaved); };
  }, []);

  useEffect(() => {
    if (!activeTrack) { setCommunity([]); return; }
    let cancelled = false;
    setCommunity([]);
    setCommunityLoading(true); setCommunityError(false);
    loadCommunityQuestions({ trackId: activeTrack.id, locale, userId, getToken }).then((rows) => { if (!cancelled) setCommunity(rows); }).catch(() => { if (!cancelled) setCommunityError(true); }).finally(() => { if (!cancelled) setCommunityLoading(false); });
    return () => { cancelled = true; };
  }, [activeTrack, filters.scope, locale, getToken, userId]);

  function updateFilters(update: Partial<LibraryFilters>) {
    const next = { ...filters, ...update };
    setFilters(next);
    const params = new URLSearchParams(toSearchParams(next));
    if (activeTrack) params.set("track", activeTrack.slug);
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
    window.dispatchEvent(new Event("urlchange"));
  }

  const scoped = activeTrack ? scopeCatalogue(activeTrack.id, filters.topic, topics, questions) : null;
  const displayQuestions = useMemo<DisplayQuestion[]>(() => {
    if (!activeTrack) return [];
    if (filters.scope === "community") return community.filter((question) => question.visibility === "community" && question.trackId === activeTrack.id);
    const publicQuestions = questions.filter((question) => question.trackId === activeTrack.id).map((question) => ({ ...question, visibility: "public" as const, likeCount: 0, likedByViewer: false, database: false }));
    const promoted = community.filter((question) => question.trackId === activeTrack.id && Boolean(question.promotedAt));
    return [...publicQuestions, ...promoted.filter((question) => !publicQuestions.some((item) => item.id === question.id))];
  }, [activeTrack, community, filters.scope, questions]);
  const scopedTopics = scoped?.topics ?? [];
  const matchingQuestions = scoped ? filterQuestions(displayQuestions, filters, saved, scopedTopics) : [];
  useEffect(() => {
    if (!authLoaded || !displayQuestions.length) { setAskedStates({}); return; }
    let cancelled = false;
    loadAskedMarkerStates({ questionIds: displayQuestions.map((question) => question.id), userId, getToken }).then((states) => { if (!cancelled) setAskedStates(states); }).catch(() => { if (!cancelled) setAskedStates({}); });
    return () => { cancelled = true; };
  }, [authLoaded, displayQuestions, getToken, userId]);
  const visibleQuestions = filters.sort === "most-asked" ? sortByInterviewFrequency(matchingQuestions, askedStates) : matchingQuestions;
  const sessionHref = filters.topic && filters.difficulty ? trackHref(`/session?topic=${encodeURIComponent(filters.topic)}&difficulty=${encodeURIComponent(filters.difficulty)}`) : null;

  async function toggleLike(question: DisplayQuestion) {
    if (!question.visibility || question.visibility === "public" || !isSignedIn) return;
    setLikeBusy((current) => ({ ...current, [question.id]: true }));
    try {
      setLikeError("");
      const result = await setQuestionLike({ getToken, questionId: question.id, liked: !question.likedByViewer });
      setCommunity((current) => current.map((item) => item.id === question.id ? { ...item, likedByViewer: result.liked, likeCount: result.likeCount, promotedAt: result.promoted ? item.promotedAt ?? new Date().toISOString() : item.promotedAt, visibility: result.promoted ? "public" : item.visibility } : item));
    } catch (error) { setLikeError(error instanceof CommunityLikeError && error.code === "daily_like_limit_reached" ? (locale === "ar" ? "وصلت للحد اليومي للإعجاب." : "You reached today's like limit.") : copy.communityLoadError); } finally { setLikeBusy((current) => ({ ...current, [question.id]: false })); }
  }

  return <>
    <ActiveTrackSelector locale={locale} />
    {phase !== "ready" || invalidTrack || !activeTrack ? null : scoped?.invalidTopic ? <ActiveTrackRecovery locale={locale} invalidTopic /> : filters.scope !== "community" && !scoped?.topics.length ? <div className="empty-state"><h2>{copy.emptyTrackTitle}</h2><p>{copy.emptyTrackDescription}</p></div> : <>
      <div className="scope-tabs" role="tablist" aria-label={copy.questions}><button role="tab" aria-selected={filters.scope === "public"} type="button" className={filters.scope === "public" ? "active" : ""} onClick={() => updateFilters({ scope: "public" })}>{copy.publicScope}</button><button role="tab" aria-selected={filters.scope === "community"} type="button" className={filters.scope === "community" ? "active" : ""} onClick={() => updateFilters({ scope: "community" })}>{copy.communityScope}</button></div>
      <form className="library-filters" onSubmit={(event) => event.preventDefault()}>
        <label>{copy.search}<input type="search" value={filters.search} onChange={(event) => updateFilters({ search: event.target.value })} placeholder={copy.searchPlaceholder} /></label>
        <label>{copy.topic}<select value={filters.topic} onChange={(event) => updateFilters({ topic: event.target.value })}><option value="">{copy.allTopics}</option>{scopedTopics.map((topic) => <option key={topic.id} value={topic.slug}>{topic.name}</option>)}</select></label>
        <label>{copy.difficulty}<select value={filters.difficulty} onChange={(event) => updateFilters({ difficulty: event.target.value as LibraryFilters["difficulty"] })}><option value="">{copy.allDifficulties}</option>{difficultyOptions.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}</select></label>
        <label>{copy.progressFilter}<select value={filters.progress} onChange={(event) => updateFilters({ progress: event.target.value as LibraryFilters["progress"] })}><option value="">{copy.allProgress}</option>{questionProgressOptions.map((option) => <option key={option.value} value={option.value}>{option.value === "not-started" ? (locale === "ar" ? "لم أبدأ" : "Not started") : option.value === "reviewing" ? copy.reviewing : copy.mastered}</option>)}</select></label>
        <label>{copy.sort}<select value={filters.sort ?? "default"} onChange={(event) => updateFilters({ sort: event.target.value as LibraryFilters["sort"] })}><option value="default">{copy.defaultSort}</option><option value="most-asked">{copy.mostAsked}</option></select></label>
        <label className="filter-checkbox"><input type="checkbox" checked={filters.favoriteOnly} onChange={(event) => updateFilters({ favoriteOnly: event.target.checked })} />{copy.favoriteOnly}</label>
      </form>
      <div className="library-toolbar"><p aria-live="polite">{visibleQuestions.length} {copy.available}</p>{sessionHref ? <Link className="button primary" href={localizedHref(locale, sessionHref)}>{copy.startSession}</Link> : <Link className="button" href={localizedHref(locale, trackHref("/session"))}>{copy.prepareSession}</Link>}</div>
      {filters.scope === "community" && communityLoading ? <LoadingPlaceholder variant="moderator" className="community-loading" /> : filters.scope === "community" && communityError ? <div className="empty-state"><p>{copy.communityLoadError}</p></div> : visibleQuestions.length ? <div className="grid">{visibleQuestions.map((question) => <article key={question.id} className="card question-card">
        <Link className="card-link" href={localizedHref(locale, question.database ? `/questions/view?slug=${encodeURIComponent(question.slug)}&track=${encodeURIComponent(question.trackId)}` : trackHref(`/questions/${question.slug}`))}><div className="meta">{scopedTopics.filter((topic) => question.topicIds.includes(topic.id)).map((topic) => <span className="chip" key={topic.id}>{topic.name}</span>)}<span className="chip">{question.difficulty}</span><span className="chip">{copy.interviewFrequency}: {formatNumber(askedStates[question.id]?.interviewFrequency ?? 0, locale)}</span>{question.promotedAt && <span className="chip chip-accent">{copy.promoted}</span>}</div><h2 className="question-title">{question.question}</h2><p>{question.contributorUsername ? `${copy.contributor} @${question.contributorUsername}` : locale === "ar" ? "اختبر إجابتك قبل ما تكشف الشرح." : "Test your answer before revealing the explanation."}</p></Link>
        {question.visibility === "community" && <div className="question-card-actions"><span className="like-count">{question.likeCount ?? 0} {copy.likes}</span>{isSignedIn ? <button className="button like-button" type="button" aria-pressed={question.likedByViewer} onClick={() => void toggleLike(question)} disabled={likeBusy[question.id] || !authLoaded}>{question.likedByViewer ? copy.unlike : copy.like}</button> : clerkEnabled ? <AuthDialogTrigger locale={locale} className="button like-button">{copy.signInToLike}</AuthDialogTrigger> : null}</div>}
        {likeError && <p className="form-error" role="alert">{likeError}</p>}
      </article>)}</div> : <div className="empty-state"><h2>{copy.noResults}</h2><p>{copy.expandFilters}</p>{filters.scope === "community" && !isSignedIn && clerkEnabled && <AuthDialogTrigger locale={locale} className="button">{copy.signInToLike}</AuthDialogTrigger>}</div>}
    </>}
  </>;
}
