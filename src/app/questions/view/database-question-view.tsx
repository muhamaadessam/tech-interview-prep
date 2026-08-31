"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AnswerContent } from "../../answer-content";
import { AnswerDisclosure, QuestionControls } from "../../question-controls";
import { DatabaseQuestionNotFound, loadDatabaseQuestion, type DatabaseQuestion } from "../../../questions/database";
import { formatDate, localizedHref, messages, type Locale } from "../../../i18n";
import { ActiveTrackRecovery, ActiveTrackSelector, useActiveTrack } from "../../active-track";
import { LoadingPlaceholder } from "../../loading-placeholder";

type State = { status: "loading" } | { status: "not-found" } | { status: "error" } | { status: "ready"; question: DatabaseQuestion };

export function DatabaseQuestionView({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug")?.trim() ?? "";
  const copy = messages[locale];
  const { phase, activeTrack, invalidTrack, trackHref } = useActiveTrack();
  const [state, setState] = useState<State>({ status: "loading" });
  const load = useCallback(() => {
    setState({ status: "loading" });
    if (!slug) {
      setState({ status: "not-found" });
      return;
    }
    loadDatabaseQuestion(slug, locale).then((question) => setState({ status: "ready", question })).catch((error) => setState({ status: error instanceof DatabaseQuestionNotFound ? "not-found" : "error" }));
  }, [locale, slug]);
  useEffect(() => { load(); }, [load]);

  if (phase !== "ready") return <section className="shell section"><ActiveTrackSelector locale={locale} /></section>;
  if (invalidTrack || !activeTrack) return <section className="shell section"><ActiveTrackRecovery locale={locale} /></section>;
  if (state.status === "loading") return <section className="shell section"><LoadingPlaceholder variant="question" /></section>;
  if (state.status === "not-found") return <section className="shell section"><header className="page-header"><span className="eyebrow">{copy.databaseQuestionEyebrow}</span><h1>{copy.notFound}</h1><p>{copy.databaseQuestionNotFound}</p><Link className="button" href={localizedHref(locale, trackHref("/questions"))}>{copy.backLibrary}</Link></header></section>;
  if (state.status === "error") return <section className="shell section"><header className="page-header"><span className="eyebrow">{copy.databaseQuestionEyebrow}</span><h1>{copy.databaseQuestionError}</h1><p>{copy.databaseQuestionErrorDescription}</p><button className="button primary" type="button" onClick={load}>{copy.databaseQuestionRetry}</button></header></section>;

  const question = state.question;
  if (question.trackId !== activeTrack.id) return <section className="shell section"><ActiveTrackRecovery locale={locale} invalidTopic /></section>;
  const currentTranslation = question.translations[locale];
  const contentQuestion = { ...question, question: currentTranslation.question, shortAnswer: currentTranslation.shortAnswer, explanation: currentTranslation.explanation, codeExample: currentTranslation.codeExample, commonMistakes: currentTranslation.commonMistakes, followUpQuestions: currentTranslation.followUpQuestions, sources: currentTranslation.sources };
  return <section className="shell section">
    <header className="page-header">
      <Link className="text-link" href={localizedHref(locale, trackHref("/questions"))}>{copy.backLibrary}</Link>
      <div className="meta">{question.topicNames.map((name) => <span className="chip" key={name}>{name}</span>)}<span className="chip">{question.difficulty}</span></div>
      <h1>{currentTranslation.question}</h1>
    </header>
    <div className="question-layout">
      <article className="question-body"><QuestionControls questionId={question.id} locale={locale} /><AnswerDisclosure key={question.id} locale={locale}><AnswerContent question={contentQuestion} locale={locale} /></AnswerDisclosure></article>
      <aside className="side-note"><b>{copy.lastReviewed}</b><div>{formatDate(question.lastReviewedAt, locale)}</div><p>{copy.staleReview}</p></aside>
    </div>
  </section>;
}
