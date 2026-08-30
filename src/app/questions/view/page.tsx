import type { Metadata } from "next";
import { Suspense } from "react";

import { DatabaseQuestionView } from "./database-question-view";

export const metadata: Metadata = { title: "سؤال من قاعدة البيانات", robots: { index: false, follow: false } };

export default function DatabaseQuestionPage() {
  return <Suspense fallback={<section className="shell section"><p>...</p></section>}><DatabaseQuestionView locale="ar" /></Suspense>;
}
