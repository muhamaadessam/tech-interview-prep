import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getQuestion, getQuestionTopics, questions } from "../../../content/questions";
import { AnswerContent } from "../../answer-content";
import { AnswerDisclosure, QuestionControls } from "../../question-controls";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return questions.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const question = getQuestion((await params).slug);
  return question
    ? { title: question.question, description: question.shortAnswer }
    : { title: "السؤال غير موجود" };
}

export default async function QuestionDetailsPage({ params }: Props) {
  const question = getQuestion((await params).slug);
  if (!question) notFound();

  return (
    <section className="shell section">
      <header className="page-header">
        <Link className="text-link" href="/questions">← مكتبة الأسئلة</Link>
        <div className="meta">
          {getQuestionTopics(question).map((topic) => (
            <span className="chip" key={topic.id}>{topic.name}</span>
          ))}
          <span className="chip">{question.difficulty}</span>
        </div>
        <h1>{question.question}</h1>
      </header>
      <div className="question-layout">
        <article className="question-body">
          <QuestionControls questionId={question.id} />
          <AnswerDisclosure key={question.id}><AnswerContent question={question} /></AnswerDisclosure>
        </article>
        <aside className="side-note">
          <b>آخر مراجعة</b>
          <div>{question.lastReviewedAt}</div>
          <p>راجع الإجابة من المصدر قبل الانترفيو لو مر وقت طويل على التاريخ ده.</p>
        </aside>
      </div>
    </section>
  );
}
