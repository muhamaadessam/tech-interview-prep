import { questions, topics } from "../../content/questions";
import { QuestionLibrary } from "./question-library";

export const metadata = { title: "مكتبة الأسئلة" };

export default function QuestionsPage() {
  return (
    <section className="shell section">
      <header className="page-header">
        <span className="eyebrow">Question Library</span>
        <h1>مكتبة الأسئلة</h1>
        <p>راجع السؤال، جاوب بصوتك، وبعدها افتح التفاصيل وقارن إجابتك بشرح مدعوم بالمصدر الرسمي.</p>
      </header>
      <QuestionLibrary
        questions={questions.map(({ id, slug, topicIds, difficulty, question, shortAnswer }) => ({ id, slug, topicIds, difficulty, question, shortAnswer }))}
        topics={topics}
      />
    </section>
  );
}
