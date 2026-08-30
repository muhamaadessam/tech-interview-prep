"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  filterQuestions,
  fromSearchParams,
  toSearchParams,
  type LibraryFilters,
  type SearchableQuestion,
} from "../../content/question-search";
import { getSavedQuestions, type QuestionProgress, type SavedQuestions } from "../../study/progress";

type LibraryTopic = { id: string; slug: string; name: string };

const emptyFilters: LibraryFilters = { search: "", topic: "", difficulty: "", progress: "", favoriteOnly: false };
const progressOptions: { value: QuestionProgress; label: string }[] = [
  { value: "not-started", label: "لم أبدأ" },
  { value: "reviewing", label: "قيد المراجعة" },
  { value: "mastered", label: "متقن" },
];

export function QuestionLibrary({ questions, topics }: { questions: SearchableQuestion[]; topics: LibraryTopic[] }) {
  const [filters, setFilters] = useState<LibraryFilters>(emptyFilters);
  const [saved, setSaved] = useState<SavedQuestions>({});

  useEffect(() => {
    setFilters({ ...emptyFilters, ...fromSearchParams(new URLSearchParams(window.location.search)) });
    setSaved(getSavedQuestions(localStorage));
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
          ابحث في الأسئلة
          <input
            type="search"
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
            placeholder="مثال: final أو وقت التشغيل"
          />
        </label>
        <label>
          الموضوع
          <select value={filters.topic} onChange={(event) => updateFilters({ topic: event.target.value })}>
            <option value="">كل الموضوعات</option>
            {topics.map((topic) => <option key={topic.id} value={topic.slug}>{topic.name}</option>)}
          </select>
        </label>
        <label>
          Difficulty Level
          <select value={filters.difficulty} onChange={(event) => updateFilters({ difficulty: event.target.value as LibraryFilters["difficulty"] })}>
            <option value="">كل المستويات</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
          </select>
        </label>
        <label>
          Question Progress
          <select value={filters.progress} onChange={(event) => updateFilters({ progress: event.target.value as LibraryFilters["progress"] })}>
            <option value="">كل الحالات</option>
            {progressOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="filter-checkbox">
          <input type="checkbox" checked={filters.favoriteOnly} onChange={(event) => updateFilters({ favoriteOnly: event.target.checked })} />
          المفضلة فقط
        </label>
      </form>

      <div className="library-toolbar">
        <p aria-live="polite">{matchingQuestions.length} سؤال متاح.</p>
        {sessionHref ? <Link className="button primary" href={sessionHref}>ابدأ جلسة المراجعة</Link> : <span className="filter-hint">اختار موضوعًا ومستوى لبدء جلسة.</span>}
      </div>

      {matchingQuestions.length ? (
        <div className="grid">
          {matchingQuestions.map((question) => (
            <Link key={question.id} className="card card-link" href={`/questions/${question.slug}`}>
              <div className="meta">
                {topics.filter((topic) => question.topicIds.includes(topic.id)).map((topic) => <span className="chip" key={topic.id}>{topic.name}</span>)}
                <span className="chip">{question.difficulty}</span>
              </div>
              <h2 className="question-title">{question.question}</h2>
              <p>اختبر إجابتك قبل ما تكشف الشرح.</p>
              <span className="text-link">فتح السؤال ←</span>
            </Link>
          ))}
        </div>
      ) : <div className="empty-state"><h2>مفيش نتائج مطابقة</h2><p>جرّب تغيّر البحث أو توسّع الفلاتر.</p></div>}
    </>
  );
}
