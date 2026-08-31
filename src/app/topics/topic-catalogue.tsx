"use client";

import Link from "next/link";

import { questions, topics } from "../../content/questions";
import { localizedHref, messages, topicName, type Locale } from "../../i18n";
import { scopeCatalogue } from "../../tracks/active-track";
import { ActiveTrackSelector, useActiveTrack } from "../active-track";

export function TopicCatalogue({ locale }: { locale: Locale }) {
  const copy = messages[locale];
  const { phase, activeTrack, invalidTrack, trackHref } = useActiveTrack();
  const scoped = activeTrack ? scopeCatalogue(activeTrack.id, null, topics, questions) : null;
  return <>
    <ActiveTrackSelector locale={locale} />
    {phase !== "ready" || invalidTrack || !activeTrack ? null : !scoped?.topics.length
      ? <div className="empty-state"><h2>{copy.emptyTrackTitle}</h2><p>{copy.emptyTrackDescription}</p></div>
      : <div className="grid">{scoped.topics.map((topic) => {
        const count = scoped.questions.filter((question) => question.topicIds.includes(topic.id)).length;
        return <Link key={topic.id} className="card card-link" href={localizedHref(locale, trackHref(`/questions?topic=${topic.slug}`))}>
          <h2 dir="ltr">{topicName(locale, topic.id)}</h2>
          <p>{count} {copy.availableQuestions}</p>
          <span className="text-link">{copy.viewQuestions}</span>
        </Link>;
      })}</div>}
  </>;
}
