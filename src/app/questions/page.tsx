import { questions, topics } from "../../content/questions";
import { QuestionLibrary } from "./question-library";
import { getQuestionTranslation, type Locale } from "../../content/questions";
import { messages, topicName } from "../../i18n";
import { localizedMetadata } from "../metadata";

export const metadata = localizedMetadata("ar", "/questions", "مكتبة الأسئلة", "مكتبة أسئلة المقابلات في المسار النشط.");

export default function QuestionsPage({ locale = "ar" }: { locale?: Locale }) {
  const copy = messages[locale];
  return (
    <section className="shell section">
      <header className="page-header">
        <span className="eyebrow">{copy.libraryEyebrow}</span>
        <h1>{copy.libraryTitle}</h1>
        <p>{copy.libraryDescription}</p>
      </header>
      <QuestionLibrary
        questions={questions.map((question) => {
          const translation = getQuestionTranslation(question, locale);
          return { id: question.id, slug: question.slug, trackId: question.trackId, topicIds: question.topicIds, difficulty: question.difficulty, question: translation.question, shortAnswer: translation.shortAnswer };
        })}
        topics={topics.map((topic) => ({ ...topic, name: topicName(locale, topic.id) }))}
        locale={locale}
      />
    </section>
  );
}
