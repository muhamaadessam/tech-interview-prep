import { questions } from "../../content/questions";
import { ProgressDashboard } from "./progress-dashboard";
import { getQuestionTranslation, type Locale } from "../../content/questions";
import { messages } from "../../i18n";
import { localizedMetadata } from "../metadata";

export const metadata = localizedMetadata("ar", "/progress", "تقدمي", "تقدمك في مراجعة أسئلة Flutter.");

export default function ProgressPage({ locale = "ar" }: { locale?: Locale }) {
  const copy = messages[locale];
  return (
    <section className="shell section">
      <header className="page-header">
        <span className="eyebrow">{copy.progressEyebrow}</span>
        <h1>{copy.progressTitle}</h1>
        <p>{copy.progressDescription}</p>
      </header>
      <ProgressDashboard questions={questions.map((question) => ({ id: question.id, slug: question.slug, question: getQuestionTranslation(question, locale).question }))} locale={locale} />
    </section>
  );
}
