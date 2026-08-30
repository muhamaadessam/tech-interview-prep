"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  getStudyData,
  type QuestionProgress,
  type QuestionStudy,
  saveQuestionStudy,
} from "../study/progress";

const progressOptions: { value: QuestionProgress; label: string }[] = [
  { value: "not-started", label: "لم أبدأ" },
  { value: "reviewing", label: "قيد المراجعة" },
  { value: "mastered", label: "متقن" },
];

export function QuestionStudyControls({ questionId }: { questionId: string }) {
  const [study, setStudy] = useState<QuestionStudy>({ progress: "not-started", favorite: false });

  useEffect(() => {
    const saved = getStudyData(localStorage)[questionId];
    if (saved) setStudy(saved);
  }, [questionId]);

  function update(patch: Partial<QuestionStudy>) {
    saveQuestionStudy(localStorage, questionId, patch);
    setStudy((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="study-controls">
      <fieldset>
        <legend>تقدم السؤال</legend>
        {progressOptions.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={`progress-${questionId}`}
              value={option.value}
              checked={study.progress === option.value}
              onChange={() => update({ progress: option.value })}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label className="favorite-control">
        <input
          type="checkbox"
          checked={study.favorite}
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
