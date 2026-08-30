import Link from "next/link";

import { questions } from "../../content/questions";

export const metadata = { title: "مكتبة الأسئلة" };

export default function QuestionsPage() {
  return (
    <section className="shell section">
      <header className="page-header">
        <span className="eyebrow">Question Library</span>
        <h1>مكتبة الأسئلة</h1>
        <p>راجع السؤال، جاوب بصوتك، وبعدها افتح التفاصيل وقارن إجابتك بشرح مدعوم بالمصدر الرسمي.</p>
      </header>
      <div className="grid">
        {questions.map((question) => (
          <Link key={question.id} className="card card-link" href={`/questions/${question.slug}`}>
            <div className="meta">
              <span className="chip">Dart</span>
              <span className="chip">{question.difficulty}</span>
            </div>
            <h2 className="question-title">{question.question}</h2>
            <p>{question.shortAnswer}</p>
            <span className="text-link">فتح السؤال ←</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
