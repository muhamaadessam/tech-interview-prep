import Link from "next/link";

import { questions, topics, tracks } from "../../content/questions";
import { messages, localizedHref, topicName, type Locale } from "../../i18n";
import { localizedMetadata } from "../metadata";

export const metadata = localizedMetadata("ar", "/topics", "الموضوعات", "موضوعات مقابلات Flutter.");

export default function TopicsPage({ locale = "ar" }: { locale?: Locale }) {
  const copy = messages[locale];
  return (
    <section className="shell section">
      <header className="page-header">
        <span className="eyebrow">{copy.topicsEyebrow}</span>
        <h1>{copy.topicsTitle}</h1>
        <p>{copy.topicsDescription}</p>
      </header>
      <div className="grid">
        {topics.map((topic) => {
          const count = questions.filter((question) => question.topicIds.includes(topic.id)).length;
          const track = tracks.find(({ id }) => id === topic.trackId);
          return (
            <Link key={topic.id} className="card card-link" href={localizedHref(locale, `/questions?topic=${topic.slug}`)}>
              <div className="meta"><span className="chip">{track?.name}</span></div>
              <h2 dir="ltr">{topicName(locale, topic.id)}</h2>
              <p>{count} {copy.availableQuestions}</p>
              <span className="text-link">{copy.viewQuestions}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
