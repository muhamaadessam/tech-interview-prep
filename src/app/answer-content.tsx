import type { InterviewQuestion } from "../content/questions";

export function AnswerContent({ question }: { question: InterviewQuestion }) {
  return (
    <>
      <h2>الإجابة المختصرة</h2>
      <p>{question.shortAnswer}</p>
      <h2>الشرح</h2>
      <p>{question.explanation}</p>
      {question.codeExample ? <><h2>مثال بالكود</h2><pre dir="ltr"><code>{question.codeExample}</code></pre></> : null}
      {question.commonMistakes?.length ? <><h2>أخطاء شائعة</h2><ul>{question.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></> : null}
      {question.followUpQuestions?.length ? <><h2>أسئلة متابعة</h2><ul>{question.followUpQuestions.map((followUp) => <li key={followUp}>{followUp}</li>)}</ul></> : null}
      <h2>المصادر</h2>
      <ul className="source-list">{question.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
    </>
  );
}
