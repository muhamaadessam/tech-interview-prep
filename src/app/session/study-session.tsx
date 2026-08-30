"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { InterviewQuestion, Topic, DifficultyLevel } from "../../content/questions";
import { difficultyOptions, fromSearchParams, questionHasTopic } from "../../content/question-search";
import { AnswerContent } from "../answer-content";
import { AnswerDisclosure, QuestionControls } from "../question-controls";

type SessionSelection = { topic: string; difficulty: DifficultyLevel | "" };

export function StudySession({ questions, topics }: { questions: InterviewQuestion[]; topics: Topic[] }) {
  const [selection, setSelection] = useState<SessionSelection>({ topic: "", difficulty: "" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    function syncFromUrl() {
      const parsed = fromSearchParams(new URLSearchParams(window.location.search));
      setSelection({ topic: parsed.topic, difficulty: parsed.difficulty });
      setCurrentIndex(0);
    }
    syncFromUrl();
    setIsHydrated(true);

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const selectedTopic = topics.find((candidate) => candidate.slug === selection.topic || candidate.id === selection.topic);
  const sessionQuestions = selection.topic && selection.difficulty && selectedTopic
    ? questions.filter((question) => questionHasTopic(question, selectedTopic.slug, topics) && question.difficulty === selection.difficulty)
    : [];
  const question = sessionQuestions[currentIndex];

  function updateSelection(update: Partial<SessionSelection>) {
    const next = { ...selection, ...update };
    setSelection(next);
    setCurrentIndex(0);
    const params = new URLSearchParams();
    if (next.topic) params.set("topic", next.topic);
    if (next.difficulty) params.set("difficulty", next.difficulty);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }

  if (!isHydrated) return <section className="shell section"><p>جاري تجهيز الجلسة...</p></section>;

  return (
    <section className="shell section">
      <header className="page-header">
        <Link className="text-link" href="/questions">← مكتبة الأسئلة</Link>
        <h1>جلسة مراجعة</h1>
        <p>اختار موضوعًا ومستوى، وراجع بالترتيب من غير مؤقت أو عشوائية.</p>
      </header>

      <div className="session-filters">
        <label>
          الموضوع
          <select value={selection.topic} onChange={(event) => updateSelection({ topic: event.target.value })}>
            <option value="">اختار موضوعًا</option>
            {topics.map((topic) => <option key={topic.id} value={topic.slug}>{topic.name}</option>)}
          </select>
        </label>
        <label>
          مستوى الصعوبة
          <select value={selection.difficulty} onChange={(event) => updateSelection({ difficulty: event.target.value as SessionSelection["difficulty"] })}>
            <option value="">اختار المستوى</option>
            {difficultyOptions.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
        </label>
      </div>

      {question ? (
        <>
          <div className="session-progress" aria-live="polite">سؤال {currentIndex + 1} من {sessionQuestions.length}</div>
          <article className="question-body session-question">
            <div className="meta"><span className="chip">{selection.difficulty}</span></div>
            <h2>{question.question}</h2>
            <div key={question.id}>
              <QuestionControls questionId={question.id} />
              <AnswerDisclosure><AnswerContent question={question} /></AnswerDisclosure>
            </div>
          </article>
          <nav className="session-navigation" aria-label="تنقل جلسة المراجعة">
            <button className="button" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>السؤال السابق</button>
            <button className="button primary" type="button" disabled={currentIndex === sessionQuestions.length - 1} onClick={() => setCurrentIndex((index) => index + 1)}>السؤال التالي</button>
          </nav>
        </>
      ) : (
        <div className="empty-state"><h2>{selection.topic || selection.difficulty ? "لا توجد أسئلة للجمع ده" : "ابدأ جلسة مراجعة"}</h2><p>اختار موضوعًا ومستوى من القوائم عشان نجهز لك الأسئلة بالترتيب.</p></div>
      )}
    </section>
  );
}
