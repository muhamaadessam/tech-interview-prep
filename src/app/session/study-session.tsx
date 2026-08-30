"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { InterviewQuestion, Topic, DifficultyLevel } from "../../content/questions";
import { AnswerDisclosure, QuestionControls } from "../question-controls";

type SessionSelection = { topic: string; difficulty: DifficultyLevel | "" };

export function StudySession({ questions, topics }: { questions: InterviewQuestion[]; topics: Topic[] }) {
  const [selection, setSelection] = useState<SessionSelection>({ topic: "", difficulty: "" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const difficulty = params.get("difficulty");
    setSelection({
      topic: params.get("topic") ?? "",
      difficulty: difficulty === "Junior" || difficulty === "Mid" || difficulty === "Senior" ? difficulty : "",
    });
    setReady(true);
  }, []);

  const sessionQuestions = selection.topic && selection.difficulty
    ? questions.filter((question) => {
        const topic = topics.find((candidate) => candidate.slug === selection.topic || candidate.id === selection.topic);
        return topic ? question.topicIds.includes(topic.id) && question.difficulty === selection.difficulty : false;
      })
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

  if (!ready) return <section className="shell section"><p>جاري تجهيز الجلسة...</p></section>;

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
          Difficulty Level
          <select value={selection.difficulty} onChange={(event) => updateSelection({ difficulty: event.target.value as SessionSelection["difficulty"] })}>
            <option value="">اختار المستوى</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
          </select>
        </label>
      </div>

      {question ? (
        <>
          <div className="session-progress" aria-live="polite">سؤال {currentIndex + 1} من {sessionQuestions.length}</div>
          <article className="question-body session-question">
            <div className="meta"><span className="chip">{selection.difficulty}</span></div>
            <h2>{question.question}</h2>
            <QuestionControls questionId={question.id} />
            <AnswerDisclosure>
              <h2>الإجابة المختصرة</h2>
              <p>{question.shortAnswer}</p>
              <h2>الشرح</h2>
              <p>{question.explanation}</p>
              {question.codeExample ? <><h2>مثال بالكود</h2><pre dir="ltr"><code>{question.codeExample}</code></pre></> : null}
              {question.commonMistakes?.length ? <><h2>أخطاء شائعة</h2><ul>{question.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></> : null}
              {question.followUpQuestions?.length ? <><h2>أسئلة متابعة</h2><ul>{question.followUpQuestions.map((followUp) => <li key={followUp}>{followUp}</li>)}</ul></> : null}
              <h2>المصادر</h2>
              <ul className="source-list">{question.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
            </AnswerDisclosure>
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
