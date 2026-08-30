import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getQuestion, questions } from "../../../content/questions";

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
          <span className="chip">Dart</span>
          <span className="chip">{question.difficulty}</span>
        </div>
        <h1>{question.question}</h1>
      </header>
      <div className="question-layout">
        <article className="question-body">
          <div className="answer">
            <h2>الإجابة المختصرة</h2>
            <p>{question.shortAnswer}</p>
          </div>
          <h2>الشرح</h2>
          <p>{question.explanation}</p>
          <h2>المصدر الرسمي</h2>
          <ul className="source-list">
            {question.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
              </li>
            ))}
          </ul>
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
