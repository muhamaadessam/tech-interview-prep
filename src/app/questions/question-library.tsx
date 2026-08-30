"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  filterQuestions,
  fromSearchParams,
  toSearchParams,
  difficultyOptions,
  type LibraryFilters,
  type SearchableQuestion,
} from "../../content/question-search";
import { getSavedQuestions, questionProgressOptions, type SavedQuestions } from "../../study/progress";
import { localizedHref, messages, type Locale } from "../../i18n";

type LibraryTopic = { id: string; slug: string; name: string };

const emptyFilters: LibraryFilters = { search: "", topic: "", difficulty: "", progress: "", favoriteOnly: false };
export function QuestionLibrary({ questions, topics, locale = "ar" }: { questions: SearchableQuestion[]; topics: LibraryTopic[]; locale?: Locale }) {
  const copy = messages[locale];
  const [filters, setFilters] = useState<LibraryFilters>(emptyFilters);
  const [saved, setSaved] = useState<SavedQuestions>({});

  useEffect(() => {
    function syncFromUrl() {
      setFilters((current) => ({
        ...current,
        ...fromSearchParams(new URLSearchParams(window.location.search)),
      }));
    }
    syncFromUrl();
    setSaved(getSavedQuestions(localStorage));

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function updateFilters(update: Partial<LibraryFilters>) {
    const next = { ...filters, ...update };
    setFilters(next);
    const query = toSearchParams(next).toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }

  const matchingQuestions = filterQuestions(questions, filters, saved, topics);
  const sessionHref = filters.topic && filters.difficulty
    ? `/session?topic=${encodeURIComponent(filters.topic)}&difficulty=${encodeURIComponent(filters.difficulty)}`
    : null;

  return (
    <>
      <form className="library-filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          {copy.search}
          <input
            type="search"
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
            placeholder={copy.searchPlaceholder}
          />
        </label>
        <label>
          {copy.topic}
          <select value={filters.topic} onChange={(event) => updateFilters({ topic: event.target.value })}>
            <option value="">{copy.allTopics}</option>
            {topics.map((topic) => <option key={topic.id} value={topic.slug}>{topic.name}</option>)}
          </select>
        </label>
        <label>
          {copy.difficulty}
          <select value={filters.difficulty} onChange={(event) => updateFilters({ difficulty: event.target.value as LibraryFilters["difficulty"] })}>
            <option value="">{copy.allDifficulties}</option>
            {difficultyOptions.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
        </label>
        <label>
          {copy.progressFilter}
          <select value={filters.progress} onChange={(event) => updateFilters({ progress: event.target.value as LibraryFilters["progress"] })}>
            <option value="">{copy.allProgress}</option>
            {questionProgressOptions.map((option) => <option key={option.value} value={option.value}>{option.value === "not-started" ? (locale === "ar" ? "لم أبدأ" : "Not started") : option.value === "reviewing" ? copy.reviewing : copy.mastered}</option>)}
          </select>
        </label>
        <label className="filter-checkbox">
          <input type="checkbox" checked={filters.favoriteOnly} onChange={(event) => updateFilters({ favoriteOnly: event.target.checked })} />
          {copy.favoriteOnly}
        </label>
      </form>

      <div className="library-toolbar">
        <p aria-live="polite">{matchingQuestions.length} {copy.available}</p>
        {sessionHref ? <Link className="button primary" href={localizedHref(locale, sessionHref)}> {copy.startSession}</Link> : <Link className="button" href={localizedHref(locale, "/session")}>{copy.prepareSession}</Link>}
      </div>

      {matchingQuestions.length ? (
        <div className="grid">
          {matchingQuestions.map((question) => (
            <Link key={question.id} className="card card-link" href={localizedHref(locale, `/questions/${question.slug}`)}>
              <div className="meta">
                {topics.filter((topic) => question.topicIds.includes(topic.id)).map((topic) => <span className="chip" key={topic.id}>{topic.name}</span>)}
                <span className="chip">{question.difficulty}</span>
              </div>
              <h2 className="question-title">{question.question}</h2>
              <p>{locale === "ar" ? "اختبر إجابتك قبل ما تكشف الشرح." : "Test your answer before revealing the explanation."}</p>
              <span className="text-link">{locale === "ar" ? "فتح السؤال ←" : "Open question →"}</span>
            </Link>
          ))}
        </div>
      ) : <div className="empty-state"><h2>{copy.noResults}</h2><p>{copy.expandFilters}</p></div>}
    </>
  );
}
