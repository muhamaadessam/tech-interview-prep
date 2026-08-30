"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getStudyData, resetStudyData, type StudyData } from "../../study/progress";

type QuestionSummary = { id: string; slug: string; question: string };

const sections = [
  { title: "قيد المراجعة", matches: (study: StudyData[string]) => study.progress === "reviewing" },
  { title: "متقن", matches: (study: StudyData[string]) => study.progress === "mastered" },
  { title: "المفضلة", matches: (study: StudyData[string]) => study.favorite },
];

export function ProgressDashboard({ questions }: { questions: QuestionSummary[] }) {
  const [data, setData] = useState<StudyData>({});

  useEffect(() => setData(getStudyData(localStorage)), []);

  function reset() {
    if (!window.confirm("متأكد إنك عايز تمسح تقدمك والمفضلة من الجهاز ده؟")) return;
    resetStudyData(localStorage);
    setData({});
  }

  return (
    <>
      <div className="progress-grid">
        {sections.map((section) => {
          const matching = questions.filter((question) => {
            const study = data[question.id];
            return study ? section.matches(study) : false;
          });
          return (
            <section className="card" key={section.title}>
              <h2>{section.title}</h2>
              {matching.length ? (
                <ul className="progress-list">
                  {matching.map((question) => (
                    <li key={question.id}><Link href={`/questions/${question.slug}`}>{question.question}</Link></li>
                  ))}
                </ul>
              ) : <p>لا توجد أسئلة هنا حاليًا.</p>}
            </section>
          );
        })}
      </div>
      <div className="reset-panel">
        <div><b>إعادة ضبط البيانات المحلية</b><p>يمسح تقدم الأسئلة والمفضلة فقط.</p></div>
        <button className="button danger" type="button" onClick={reset}>إعادة ضبط التقدم</button>
      </div>
    </>
  );
}
