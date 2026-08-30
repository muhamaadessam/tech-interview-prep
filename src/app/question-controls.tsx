"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  defaultQuestionState,
  getSavedQuestions,
  questionProgressOptions,
  type SavedQuestionState,
  saveQuestionState,
} from "../study/progress";
import { messages } from "../i18n";
import type { Locale } from "../content/questions";

export function QuestionControls({ questionId, locale = "ar" }: { questionId: string; locale?: Locale }) {
  const [questionState, setQuestionState] = useState<SavedQuestionState>(defaultQuestionState);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    const load = () => {
      const saved = getSavedQuestions(localStorage)[questionId];
      setQuestionState(saved ?? defaultQuestionState);
    };
    load();
    window.addEventListener("study-state-merged", load);
    return () => window.removeEventListener("study-state-merged", load);
  }, [questionId]);

  function update(patch: Partial<SavedQuestionState>) {
    saveQuestionState(localStorage, questionId, patch);
    setQuestionState((current) => ({ ...current, ...patch }));
    window.dispatchEvent(new Event("study-state-change"));
    setSaveStatus(messages[locale].saved);
  }

  return (
    <div className="question-controls">
      <span className="sr-only" aria-live="polite">{saveStatus}</span>
      <fieldset>
        <legend>{messages[locale].progressLegend}</legend>
        {questionProgressOptions.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={`progress-${questionId}`}
              value={option.value}
              checked={questionState.progress === option.value}
              onChange={() => update({ progress: option.value })}
            />
            {option.value === "not-started" ? (locale === "ar" ? "لم أبدأ" : "Not started") : option.value === "reviewing" ? messages[locale].reviewing : messages[locale].mastered}
          </label>
        ))}
      </fieldset>
      <label className="favorite-control">
        <input
          type="checkbox"
          checked={questionState.favorite}
          onChange={(event) => update({ favorite: event.target.checked })}
        />
        {messages[locale].favorite}
      </label>
    </div>
  );
}

export function AnswerDisclosure({ children, locale = "ar" }: { children: ReactNode; locale?: Locale }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="answer">
      <button
        className="answer-toggle"
        type="button"
        aria-expanded={revealed}
        aria-controls="question-answer"
        onClick={() => setRevealed((current) => !current)}
      >
        {revealed ? messages[locale].hide : messages[locale].reveal}
      </button>
      {revealed ? <div className="answer-content" id="question-answer">{children}</div> : null}
    </div>
  );
}
