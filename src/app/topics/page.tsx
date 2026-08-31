import { messages, type Locale } from "../../i18n";
import { localizedMetadata } from "../metadata";
import { TopicCatalogue } from "./topic-catalogue";

export const metadata = localizedMetadata("ar", "/topics", "الموضوعات", "موضوعات المقابلات في المسار النشط.");

export default function TopicsPage({ locale = "ar" }: { locale?: Locale }) {
  const copy = messages[locale];
  return (
    <section className="shell section">
      <header className="page-header">
        <span className="eyebrow">{copy.topicsEyebrow}</span>
        <h1>{copy.topicsTitle}</h1>
        <p>{copy.topicsDescription}</p>
      </header>
      <TopicCatalogue locale={locale} />
    </section>
  );
}
