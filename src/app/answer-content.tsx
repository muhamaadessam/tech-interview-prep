import type { InterviewQuestion } from "../content/questions";
import { getQuestionTranslation, type Locale } from "../content/questions";
import { messages } from "../i18n";

export function AnswerContent({ question, locale = "ar" }: { question: InterviewQuestion; locale?: Locale }) {
  const copy = messages[locale];
  const translation = getQuestionTranslation(question, locale);
  return (
    <>
      <h2>{copy.shortAnswer}</h2>
      <p>{translation.shortAnswer}</p>
      <h2>{copy.explanation}</h2>
      <p>{translation.explanation}</p>
      {translation.codeExample ? <><h2>{copy.code}</h2><pre dir="ltr"><code>{translation.codeExample}</code></pre></> : null}
      {translation.commonMistakes?.length ? <><h2>{copy.mistakes}</h2><ul>{translation.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></> : null}
      {translation.followUpQuestions?.length ? <><h2>{copy.followUps}</h2><ul>{translation.followUpQuestions.map((followUp) => <li key={followUp}>{followUp}</li>)}</ul></> : null}
      <h2>{copy.sources}</h2>
      <ul className="source-list">{translation.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
    </>
  );
}
