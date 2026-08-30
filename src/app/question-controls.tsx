"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  defaultQuestionState,
  getSavedQuestions,
  type QuestionProgress,
  type SavedQuestionState,
  saveQuestionState,
} from "../study/progress";

const progressOptions: { value: QuestionProgress; label: string }[] = [
  { value: "not-started", label: "لم أبدأ" },
  { value: "reviewing", label: "قيد المراجعة" },
  { value: "mastered", label: "متقن" },
];

export function QuestionControls({ questionId }: { questionId: string }) {
  const [questionState, setQuestionState] = useState<SavedQuestionState>(defaultQuestionState);

  useEffect(() => {
    const saved = getSavedQuestions(localStorage)[questionId];
    if (saved) setQuestionState(saved);
  }, [questionId]);

  function update(patch: Partial<SavedQuestionState>) {
    saveQuestionState(localStorage, questionId, patch);
    setQuestionState((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="question-controls">
      <fieldset>
        <legend>تقدم السؤال</legend>
        {progressOptions.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={`progress-${questionId}`}
              value={option.value}
              checked={questionState.progress === option.value}
              onChange={() => update({ progress: option.value })}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label className="favorite-control">
        <input
          type="checkbox"
          checked={questionState.favorite}
          onChange={(event) => update({ favorite: event.target.checked })}
        />
        حفظ في المفضلة
      </label>
    </div>
  );
}

export function AnswerDisclosure({ children }: { children: ReactNode }) {
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
        {revealed ? "اخفِ الإجابة" : "اكشف الإجابة"}
      </button>
      {revealed ? <div className="answer-content" id="question-answer">{children}</div> : null}
    </div>
  );
}
