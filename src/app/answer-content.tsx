import type { InterviewQuestion } from "../content/questions";
import { getFollowUpQuestionRefs, getQuestionTranslation, type Locale } from "../content/questions";
import { localizedHref, messages } from "../i18n";
import Link from "next/link";

export function AnswerContent({ question, locale = "ar" }: { question: InterviewQuestion; locale?: Locale }) {
  const copy = messages[locale];
  const translation = getQuestionTranslation(question, locale);
  const followUps = getFollowUpQuestionRefs(question, locale);
  return (
    <>
      <h2>{copy.shortAnswer}</h2>
      <p>{translation.shortAnswer}</p>
      <h2>{copy.explanation}</h2>
      <p>{translation.explanation}</p>
      {translation.codeExample ? <><h2>{copy.code}</h2><pre dir="ltr"><code>{translation.codeExample}</code></pre></> : null}
      {translation.commonMistakes?.length ? <><h2>{copy.mistakes}</h2><ul>{translation.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></> : null}
      {followUps.length ? <><h2>{copy.followUps}</h2><ul>{followUps.map((followUp) => <li key={followUp.id}><Link className="text-link" href={localizedHref(locale, followUp.href ?? `/questions/${followUp.slug}`)}>{followUp.label}</Link></li>)}</ul></> : null}
      <h2>{copy.sources}</h2>
      <ul className="source-list">{translation.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
    </>
  );
}
