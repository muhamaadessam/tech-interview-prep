"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getSavedQuestions, resetSavedQuestions, type SavedQuestions } from "../../study/progress";
import { localizedHref, messages, type Locale } from "../../i18n";
import { useActiveTrack } from "../active-track";
import { tracks } from "../../content/questions";
import { withTrack } from "../../tracks/active-track";

type QuestionSummary = { id: string; slug: string; trackId: string; question: string };

export function ProgressDashboard({ questions, locale = "ar" }: { questions: QuestionSummary[]; locale?: Locale }) {
  const copy = messages[locale];
  const { trackHref } = useActiveTrack();
  const sections = [
    { title: copy.reviewing, matches: (saved: SavedQuestions[string]) => saved.progress === "reviewing" },
    { title: copy.mastered, matches: (saved: SavedQuestions[string]) => saved.progress === "mastered" },
    { title: copy.favorites, matches: (saved: SavedQuestions[string]) => saved.favorite },
  ];
  const [data, setData] = useState<SavedQuestions>({});

  useEffect(() => {
    const load = () => setData(getSavedQuestions(localStorage));
    load();
    window.addEventListener("study-state-merged", load);
    return () => window.removeEventListener("study-state-merged", load);
  }, []);

  function reset() {
    if (!window.confirm(copy.resetConfirm)) return;
    resetSavedQuestions(localStorage);
    setData({});
    window.dispatchEvent(new Event("study-state-change"));
  }

  return (
    <>
      <div className="progress-summary">
        <p>{copy.reviewed} <strong>{questions.filter((question) => data[question.id]?.progress === "reviewing" || data[question.id]?.progress === "mastered").length}</strong> {locale === "ar" ? "من" : "of"} {questions.length} {locale === "ar" ? "سؤالًا." : "questions."}</p>
        <Link className="button primary" href={localizedHref(locale, trackHref("/questions"))}>{copy.continueReview}</Link>
      </div>
      <div className="progress-grid">
        {sections.map((section) => {
          const matching = questions.filter((question) => {
            const study = data[question.id];
            return study ? section.matches(study) : false;
          });
          return (
            <section className="card" key={section.title}>
              <h2>{section.title}</h2>
              {matching.length ? (
                <ul className="progress-list">
                  {matching.map((question) => (
                    <li key={question.id}><Link href={localizedHref(locale, withTrack(`/questions/${question.slug}`, tracks.find(({ id }) => id === question.trackId)?.slug ?? question.trackId))}>{question.question}</Link></li>
                  ))}
                </ul>
              ) : <p>{copy.noQuestions}</p>}
            </section>
          );
        })}
      </div>
      <div className="reset-panel">
        <div><b>{copy.resetTitle}</b><p>{copy.resetDescription}</p></div>
        <button className="button danger" type="button" onClick={reset}>{copy.reset}</button>
      </div>
    </>
  );
}
