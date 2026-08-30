import Link from "next/link";

import { getQuestionTopics, questions, topics } from "../content/questions";

export default function HomePage() {
  const question = questions[0];

  return (
    <>
      <section className="shell hero">
        <div>
          <span className="eyebrow">مسار Flutter متاح الآن</span>
          <h1>ادخل الانترفيو وإجابتك مرتبة في دماغك.</h1>
          <p className="lead">
            أسئلة تقنية مختارة، إجابات عربية واضحة، ومراجع رسمية تساعدك تراجع المفهوم بدل ما تحفظ جملة.
          </p>
          <div className="actions">
            <Link className="button primary" href="/questions">ابدأ المراجعة</Link>
            <Link className="button" href="/topics">استكشف الموضوعات</Link>
          </div>
        </div>
        <aside className="hero-card" aria-label="ملخص المحتوى الحالي">
          <strong>{questions.length}</strong>
          <span>سؤال دائم في النسخة الأولى</span>
          <hr />
          <b>{topics[0]?.name}</b>
          <p>أول موضوع متاح ضمن مسار Flutter.</p>
        </aside>
      </section>

      <section className="shell section" aria-labelledby="featured-title">
        <div className="section-header">
          <div>
            <h2 id="featured-title">ابدأ بسؤال Dart</h2>
            <p>إجابة قصيرة أولاً، ثم شرح أعمق ومصدر رسمي.</p>
          </div>
          <Link className="text-link" href="/questions">كل الأسئلة</Link>
        </div>
        {question && (
          <Link className="card card-link" href={`/questions/${question.slug}`}>
            <div className="meta">
              {getQuestionTopics(question).map((topic) => (
                <span className="chip" key={topic.id}>{topic.name}</span>
              ))}
              <span className="chip">{question.difficulty}</span>
            </div>
            <h3 className="question-title">{question.question}</h3>
            <p>{question.shortAnswer}</p>
            <span className="text-link">اقرأ الإجابة كاملة ←</span>
          </Link>
        )}
      </section>
    </>
  );
}
