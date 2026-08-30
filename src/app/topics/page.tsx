import Link from "next/link";

import { questions, topics, tracks } from "../../content/questions";

export const metadata = { title: "الموضوعات" };

export default function TopicsPage() {
  return (
    <section className="shell section">
      <header className="page-header">
        <span className="eyebrow">Flutter Track</span>
        <h1>الموضوعات</h1>
        <p>المحتوى متقسم حسب المفاهيم اللي بتتقابل في الانترفيو. نبدأ بـ Dart ونضيف باقي موضوعات Flutter تباعًا.</p>
      </header>
      <div className="grid">
        {topics.map((topic) => {
          const count = questions.filter((question) => question.topicIds.includes(topic.id)).length;
          const track = tracks.find(({ id }) => id === topic.trackId);
          return (
            <Link key={topic.id} className="card card-link" href={`/questions?topic=${topic.slug}`}>
              <div className="meta"><span className="chip">{track?.name}</span></div>
              <h2 dir="ltr">{topic.name}</h2>
              <p>{count} سؤال متاح للمراجعة حاليًا.</p>
              <span className="text-link">عرض الأسئلة ←</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
