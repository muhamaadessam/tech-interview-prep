"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { DifficultyLevel, InterviewQuestion, Topic } from "../../content/questions";
import { difficultyOptions, filterInterviewQuestions } from "../../content/question-search";
import { AnswerContent } from "../answer-content";
import { AnswerDisclosure, QuestionControls } from "../question-controls";

type InterviewSelection = { topicValues: string[]; difficulty: DifficultyLevel | "" };

function readSelection(search: string, availableTopics: Topic[]): InterviewSelection {
  const params = new URLSearchParams(search);
  const values = (params.get("topics") ?? params.get("topic") ?? "").split(",").filter(Boolean);
  const topicValues = [...new Set(values.filter((value) => availableTopics.some((topic) => topic.slug === value || topic.id === value)))];
  const difficulty = params.get("difficulty");
  return {
    topicValues,
    difficulty: difficulty && difficultyOptions.includes(difficulty as DifficultyLevel) ? difficulty as DifficultyLevel : "",
  };
}

function updateUrl(selection: InterviewSelection) {
  const params = new URLSearchParams();
  if (selection.topicValues.length) params.set("topics", selection.topicValues.join(","));
  if (selection.difficulty) params.set("difficulty", selection.difficulty);
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

export function FullInterview({ questions, topics }: { questions: InterviewQuestion[]; topics: Topic[] }) {
  const [selection, setSelection] = useState<InterviewSelection>({ topicValues: [], difficulty: "" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    function syncFromUrl() {
      setSelection(readSelection(window.location.search, topics));
      setCurrentIndex(0);
    }
    syncFromUrl();
    setIsHydrated(true);
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [topics]);

  const sessionQuestions = selection.topicValues.length && selection.difficulty
    ? filterInterviewQuestions(questions, selection.topicValues, selection.difficulty, topics)
    : [];
  const question = sessionQuestions[currentIndex];

  function updateSelection(update: Partial<InterviewSelection>) {
    const next = { ...selection, ...update };
    setSelection(next);
    setCurrentIndex(0);
    updateUrl(next);
  }

  function toggleTopic(topic: Topic, checked: boolean) {
    const topicValues = checked
      ? [...selection.topicValues, topic.slug]
      : selection.topicValues.filter((value) => value !== topic.slug && value !== topic.id);
    updateSelection({ topicValues });
  }

  if (!isHydrated) return <section className="shell section"><p>جاري تجهيز المقابلة...</p></section>;

  return (
    <section className="shell section">
      <header className="page-header">
        <Link className="text-link" href="/questions">← مكتبة الأسئلة</Link>
        <span className="eyebrow">مقابلة Flutter كاملة</span>
        <h1>ابنِ انترفيو شامل</h1>
        <p>اختار أكثر من موضوع ومستوى واحد. المستوى الأعلى يشمل أسئلته وأسئلة المستويات الأقل.</p>
      </header>

      <div className="interview-builder">
        <fieldset className="topic-picker">
          <legend>اختار الموضوعات</legend>
          <div className="topic-options">
            {topics.map((topic) => (
              <label key={topic.id}>
                <input
                  type="checkbox"
                  checked={selection.topicValues.includes(topic.slug) || selection.topicValues.includes(topic.id)}
                  onChange={(event) => toggleTopic(topic, event.target.checked)}
                />
                {topic.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          مستوى المقابلة
          <select value={selection.difficulty} onChange={(event) => updateSelection({ difficulty: event.target.value as InterviewSelection["difficulty"] })}>
            <option value="">اختار المستوى</option>
            {difficultyOptions.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
          <span className="filter-hint">Junior: Junior فقط · Mid: Junior وMid · Senior: كل المستويات</span>
        </label>
      </div>

      {question ? (
        <>
          <div className="session-progress" aria-live="polite">سؤال {currentIndex + 1} من {sessionQuestions.length}</div>
          <article className="question-body session-question">
            <div className="meta">
              {topics.filter((topic) => question.topicIds.includes(topic.id) && selection.topicValues.includes(topic.slug)).map((topic) => <span className="chip" key={topic.id}>{topic.name}</span>)}
              <span className="chip">{question.difficulty}</span>
            </div>
            <h2>{question.question}</h2>
            <div key={question.id}>
              <QuestionControls questionId={question.id} />
              <AnswerDisclosure><AnswerContent question={question} /></AnswerDisclosure>
            </div>
          </article>
          <nav className="session-navigation" aria-label="تنقل المقابلة الكاملة">
            <button className="button" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>السؤال السابق</button>
            <button className="button primary" type="button" disabled={currentIndex === sessionQuestions.length - 1} onClick={() => setCurrentIndex((index) => index + 1)}>السؤال التالي</button>
          </nav>
        </>
      ) : (
        <div className="empty-state">
          <h2>{selection.topicValues.length || selection.difficulty ? "كمّل إعداد المقابلة" : "ابدأ مقابلة كاملة"}</h2>
          <p>اختار موضوعًا واحدًا على الأقل ومستوى المقابلة عشان نجهز لك الأسئلة.</p>
        </div>
      )}
    </section>
  );
}
