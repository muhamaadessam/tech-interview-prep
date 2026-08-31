"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getQuestionTranslation, type InterviewQuestion, type Topic, type DifficultyLevel, type Locale } from "../../content/questions";
import { difficultyOptions, fromSearchParams, questionHasTopic } from "../../content/question-search";
import { AnswerContent } from "../answer-content";
import { AnswerDisclosure, QuestionControls } from "../question-controls";
import { localizedHref, messages, topicName } from "../../i18n";
import { scopeCatalogue } from "../../tracks/active-track";
import { ActiveTrackRecovery, ActiveTrackSelector, useActiveTrack } from "../active-track";

type SessionSelection = { topic: string; difficulty: DifficultyLevel | "" };

export function StudySession({ questions, topics, locale = "ar" }: { questions: InterviewQuestion[]; topics: Topic[]; locale?: Locale }) {
  const copy = messages[locale];
  const [selection, setSelection] = useState<SessionSelection>({ topic: "", difficulty: "" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const { phase, activeTrack, invalidTrack, trackHref } = useActiveTrack();

  useEffect(() => {
    function syncFromUrl() {
      const parsed = fromSearchParams(new URLSearchParams(window.location.search));
      setSelection({ topic: parsed.topic, difficulty: parsed.difficulty });
      setCurrentIndex(0);
    }
    syncFromUrl();
    setIsHydrated(true);

    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("urlchange", syncFromUrl);
    return () => { window.removeEventListener("popstate", syncFromUrl); window.removeEventListener("urlchange", syncFromUrl); };
  }, []);

  const scoped = activeTrack ? scopeCatalogue(activeTrack.id, selection.topic, topics, questions) : null;
  const selectedTopic = scoped?.topics.find((candidate) => candidate.slug === selection.topic || candidate.id === selection.topic);
  const sessionQuestions = selection.topic && selection.difficulty && selectedTopic && scoped
    ? scoped.questions.filter((question) => questionHasTopic(question, selectedTopic.slug, scoped.topics) && question.difficulty === selection.difficulty)
    : [];
  const question = sessionQuestions[currentIndex];

  function updateSelection(update: Partial<SessionSelection>) {
    const next = { ...selection, ...update };
    setSelection(next);
    setCurrentIndex(0);
    const params = new URLSearchParams();
    if (next.topic) params.set("topic", next.topic);
    if (next.difficulty) params.set("difficulty", next.difficulty);
    if (activeTrack) params.set("track", activeTrack.slug);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }

  if (!isHydrated) return <section className="shell section"><p>{copy.preparing}</p></section>;

  return (
    <section className="shell section">
      <header className="page-header">
        <Link className="text-link" href={localizedHref(locale, trackHref("/questions"))}>{copy.backLibrary}</Link>
        <h1>{copy.sessionTitle}</h1>
        <p>{copy.sessionDescription}</p>
      </header>

      <ActiveTrackSelector locale={locale} />
      {phase !== "ready" || invalidTrack || !activeTrack ? null : scoped?.invalidTopic ? <ActiveTrackRecovery locale={locale} invalidTopic /> : !scoped?.topics.length ? <div className="empty-state"><h2>{copy.emptyTrackTitle}</h2><p>{copy.emptyTrackDescription}</p></div> : <>

      <div className="session-filters">
        <label>
          {copy.topic}
          <select value={selection.topic} onChange={(event) => updateSelection({ topic: event.target.value })}>
            <option value="">{copy.chooseTopic}</option>
            {scoped.topics.map((topic) => <option key={topic.id} value={topic.slug}>{topicName(locale, topic.id)}</option>)}
          </select>
        </label>
        <label>
          {copy.difficulty}
          <select value={selection.difficulty} onChange={(event) => updateSelection({ difficulty: event.target.value as SessionSelection["difficulty"] })}>
            <option value="">{copy.chooseDifficulty}</option>
            {difficultyOptions.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
        </label>
      </div>

      {question ? (
        <>
          <div className="session-progress" aria-live="polite">{copy.question} {currentIndex + 1} {copy.of} {sessionQuestions.length}</div>
          <article className="question-body session-question">
            <div className="meta"><span className="chip">{selection.difficulty}</span></div>
            <h2>{getQuestionTranslation(question, locale).question}</h2>
            <div key={question.id}>
              <QuestionControls questionId={question.id} locale={locale} />
              <AnswerDisclosure locale={locale}><AnswerContent question={question} locale={locale} /></AnswerDisclosure>
            </div>
          </article>
          <nav className="session-navigation" aria-label={copy.sessionTitle}>
            <button className="button" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>{copy.previous}</button>
            <button className="button primary" type="button" disabled={currentIndex === sessionQuestions.length - 1} onClick={() => setCurrentIndex((index) => index + 1)}>{copy.next}</button>
          </nav>
        </>
      ) : (
        <div className="empty-state"><h2>{selection.topic || selection.difficulty ? copy.noCombination : copy.startStudy}</h2><p>{copy.selectSession}</p></div>
      )}
      </>}
    </section>
  );
}
