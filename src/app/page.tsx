import Link from "next/link";

import { getQuestionTopics, questions, topics } from "../content/questions";
import { getQuestionTranslation } from "../content/questions";
import { messages, localizedHref, topicName, type Locale } from "../i18n";

export default function HomePage({ locale = "ar" }: { locale?: Locale }) {
  const copy = messages[locale];
  const question = questions[0];

  return (
    <>
      <section className="shell hero">
        <div>
          <span className="eyebrow">{copy.homeEyebrow}</span>
          <h1>{copy.homeTitle}</h1>
          <p className="lead">{copy.homeLead}</p>
          <div className="actions">
            <Link className="button primary" href={localizedHref(locale, "/questions")}>{copy.startReview}</Link>
            <Link className="button" href={localizedHref(locale, "/topics")}>{copy.exploreTopics}</Link>
          </div>
        </div>
        <aside className="hero-card" aria-label="ملخص المحتوى الحالي">
          <strong>{questions.length}</strong>
          <span>{questions.length} {copy.currentQuestions}</span>
          <hr />
          <b>{topics[0] ? topicName(locale, topics[0].id) : ""}</b>
          <p>{copy.firstTopic}</p>
        </aside>
      </section>

      <section className="shell section" aria-labelledby="featured-title">
        <div className="section-header">
          <div>
            <h2 id="featured-title">{copy.featuredTitle}</h2>
            <p>{copy.featuredLead}</p>
          </div>
          <Link className="text-link" href={localizedHref(locale, "/questions")}>{copy.allQuestions}</Link>
        </div>
        {question && (
          <Link className="card card-link" href={localizedHref(locale, `/questions/${question.slug}`)}>
            <div className="meta">
              {getQuestionTopics(question).map((topic) => (
                <span className="chip" key={topic.id}>{topicName(locale, topic.id)}</span>
              ))}
              <span className="chip">{question.difficulty}</span>
            </div>
            <h3 className="question-title">{getQuestionTranslation(question, locale).question}</h3>
            <p>{copy.answerPrompt}</p>
            <span className="text-link">{copy.readAnswer}</span>
          </Link>
        )}
      </section>
    </>
  );
}
