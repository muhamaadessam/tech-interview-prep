import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getQuestion, getQuestionTopics, questions } from "../../../content/questions";
import { AnswerDisclosure, QuestionStudyControls } from "../../question-study-controls";

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
          <QuestionStudyControls questionId={question.id} />
          <AnswerDisclosure>
            <h2>الإجابة المختصرة</h2>
            <p>{question.shortAnswer}</p>
            <h2>الشرح</h2>
            <p>{question.explanation}</p>
            {question.codeExample ? (
              <>
                <h2>مثال بالكود</h2>
                <pre dir="ltr"><code>{question.codeExample}</code></pre>
              </>
            ) : null}
            {question.commonMistakes?.length ? (
              <>
                <h2>أخطاء شائعة</h2>
                <ul>{question.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
              </>
            ) : null}
            {question.followUpQuestions?.length ? (
              <>
                <h2>أسئلة متابعة</h2>
                <ul>{question.followUpQuestions.map((followUp) => <li key={followUp}>{followUp}</li>)}</ul>
              </>
            ) : null}
            <h2>المصادر</h2>
            <ul className="source-list">
              {question.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                </li>
              ))}
            </ul>
          </AnswerDisclosure>
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
