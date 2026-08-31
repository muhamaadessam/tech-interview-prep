"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getQuestionTranslation, type DifficultyLevel, type InterviewQuestion, type Topic, type Locale } from "../../content/questions";
import { difficultyOptions, filterInterviewQuestions } from "../../content/question-search";
import { AnswerContent } from "../answer-content";
import { AnswerDisclosure, QuestionControls } from "../question-controls";
import { localizedHref, messages, topicName } from "../../i18n";
import { scopeCatalogue } from "../../tracks/active-track";
import { ActiveTrackRecovery, ActiveTrackSelector, useActiveTrack } from "../active-track";
import { LoadingPlaceholder } from "../loading-placeholder";

type InterviewSelection = { topicValues: string[]; difficulty: DifficultyLevel | ""; invalidTopics: boolean };

function readSelection(search: string, availableTopics: Topic[]): InterviewSelection {
  const params = new URLSearchParams(search);
  const values = (params.get("topics") ?? params.get("topic") ?? "").split(",").filter(Boolean);
  const topicValues = [...new Set(values.filter((value) => availableTopics.some((topic) => topic.slug === value || topic.id === value)))];
  const difficulty = params.get("difficulty");
  return {
    topicValues,
    difficulty: difficulty && difficultyOptions.includes(difficulty as DifficultyLevel) ? difficulty as DifficultyLevel : "",
    invalidTopics: values.length !== topicValues.length,
  };
}

function updateUrl(selection: InterviewSelection, track: string | null) {
  const params = new URLSearchParams();
  if (selection.topicValues.length) params.set("topics", selection.topicValues.join(","));
  if (selection.difficulty) params.set("difficulty", selection.difficulty);
  if (track) params.set("track", track);
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  window.dispatchEvent(new Event("urlchange"));
}

export function FullInterview({ questions, topics, locale = "ar" }: { questions: InterviewQuestion[]; topics: Topic[]; locale?: Locale }) {
  const copy = messages[locale];
  const [selection, setSelection] = useState<InterviewSelection>({ topicValues: [], difficulty: "", invalidTopics: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const { phase, activeTrack, invalidTrack, trackHref } = useActiveTrack();
  const scoped = useMemo(() => activeTrack ? scopeCatalogue(activeTrack.id, null, topics, questions) : null, [activeTrack, questions, topics]);

  useEffect(() => {
    function syncFromUrl() {
      setSelection(readSelection(window.location.search, scoped?.topics ?? []));
      setCurrentIndex(0);
    }
    syncFromUrl();
    setIsHydrated(true);
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("urlchange", syncFromUrl);
    return () => { window.removeEventListener("popstate", syncFromUrl); window.removeEventListener("urlchange", syncFromUrl); };
  }, [scoped]);

  const sessionQuestions = selection.topicValues.length && selection.difficulty
    ? filterInterviewQuestions(scoped?.questions ?? [], selection.topicValues, selection.difficulty, scoped?.topics ?? [])
    : [];
  const question = sessionQuestions[currentIndex];

  function updateSelection(update: Partial<InterviewSelection>) {
    const next = { ...selection, ...update, invalidTopics: false };
    setSelection(next);
    setCurrentIndex(0);
    updateUrl(next, activeTrack?.slug ?? null);
  }

  function toggleTopic(topic: Topic, checked: boolean) {
    const topicValues = checked
      ? [...selection.topicValues, topic.slug]
      : selection.topicValues.filter((value) => value !== topic.slug && value !== topic.id);
    updateSelection({ topicValues });
  }

  if (!isHydrated) return <section className="shell section"><LoadingPlaceholder variant="interview" /></section>;

  return (
    <section className="shell section interview-page">
      <header className="page-header">
        <Link className="text-link" href={localizedHref(locale, trackHref("/questions"))}>{copy.backLibrary}</Link>
        <span className="eyebrow">{copy.interviewEyebrow}</span>
        <h1>{copy.interviewTitle}</h1>
        <p>{copy.interviewDescription}</p>
      </header>

      <ActiveTrackSelector locale={locale} />
      {phase !== "ready" || invalidTrack || !activeTrack ? null : selection.invalidTopics ? <ActiveTrackRecovery locale={locale} invalidTopic /> : !scoped?.topics.length ? <div className="empty-state"><h2>{copy.emptyTrackTitle}</h2><p>{copy.emptyTrackDescription}</p></div> : <>

      <div className="interview-builder">
        <fieldset className="topic-picker">
          <legend>{copy.chooseTopics} <span className="topic-count">{selection.topicValues.length} {copy.selected}</span></legend>
          <div className="topic-options">
            {scoped.topics.map((topic) => (
              <label key={topic.id}>
                <input
                  type="checkbox"
                  checked={selection.topicValues.includes(topic.slug) || selection.topicValues.includes(topic.id)}
                  onChange={(event) => toggleTopic(topic, event.target.checked)}
                />
                {topicName(locale, topic.id)}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="interview-level">
          {copy.interviewLevel}
          <select value={selection.difficulty} onChange={(event) => updateSelection({ difficulty: event.target.value as InterviewSelection["difficulty"] })}>
            <option value="">{copy.chooseDifficulty}</option>
            {difficultyOptions.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
          <span className="filter-hint">{copy.inclusiveHint}</span>
        </label>
      </div>

      {question ? (
        <>
          <div className="session-progress" aria-live="polite">{copy.question} {currentIndex + 1} {copy.of} {sessionQuestions.length}</div>
          <article className="question-body session-question">
            <div className="meta">
              {scoped.topics.filter((topic) => question.topicIds.includes(topic.id) && selection.topicValues.includes(topic.slug)).map((topic) => <span className="chip" key={topic.id}>{topicName(locale, topic.id)}</span>)}
              <span className="chip">{question.difficulty}</span>
            </div>
            <h2>{getQuestionTranslation(question, locale).question}</h2>
            <div key={question.id}>
              <QuestionControls questionId={question.id} locale={locale} />
              <AnswerDisclosure locale={locale}><AnswerContent question={question} locale={locale} /></AnswerDisclosure>
            </div>
          </article>
          <nav className="session-navigation" aria-label={copy.interviewTitle}>
            <button className="button" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>{copy.previous}</button>
            <button className="button primary" type="button" disabled={currentIndex === sessionQuestions.length - 1} onClick={() => setCurrentIndex((index) => index + 1)}>{copy.next}</button>
          </nav>
        </>
      ) : (
        <div className="empty-state">
          <h2>{selection.topicValues.length || selection.difficulty ? copy.completeSetup : copy.startInterview}</h2>
          <p>{copy.interviewEmpty}</p>
        </div>
      )}
      </>}
    </section>
  );
}
