import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getQuestion, getQuestionTopics, getQuestionTranslation, questions } from "../../../content/questions";
import { AnswerContent } from "../../answer-content";
import { AnswerDisclosure, QuestionControls } from "../../question-controls";
import { formatDate, messages, topicName, type Locale } from "../../../i18n";
import { localizedMetadata } from "../../metadata";
import { ActiveTrackLink, TrackContextGuard } from "../../active-track";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return questions.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const question = getQuestion((await params).slug);
  return question
    ? localizedMetadata("ar", `/questions/${question.slug}`, question.question, question.shortAnswer)
    : { title: "السؤال غير موجود" };
}

export default async function QuestionDetailsPage({ params, locale = "ar" }: Props & { locale?: Locale }) {
  const question = getQuestion((await params).slug);
  if (!question) notFound();
  const copy = messages[locale];
  const translation = getQuestionTranslation(question, locale);

  return <TrackContextGuard locale={locale} trackId={question.trackId}>
    <section className="shell section">
      <header className="page-header">
        <ActiveTrackLink className="text-link" locale={locale} path="/questions">{copy.backLibrary}</ActiveTrackLink>
        <div className="meta">
          {getQuestionTopics(question).map((topic) => (
            <span className="chip" key={topic.id}>{topicName(locale, topic.id)}</span>
          ))}
          <span className="chip">{question.difficulty}</span>
        </div>
        <h1>{translation.question}</h1>
      </header>
      <div className="question-layout">
        <article className="question-body">
          <QuestionControls questionId={question.id} locale={locale} />
          <AnswerDisclosure key={question.id} locale={locale}><AnswerContent question={question} locale={locale} /></AnswerDisclosure>
        </article>
        <aside className="side-note">
          <b>{copy.lastReviewed}</b>
          <div>{formatDate(question.lastReviewedAt, locale)}</div>
          <p>{copy.staleReview}</p>
        </aside>
      </div>
    </section>
  </TrackContextGuard>;
}
