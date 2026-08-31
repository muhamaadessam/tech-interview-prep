import type { Metadata } from "next";
import { Suspense } from "react";

import { DatabaseQuestionView } from "./database-question-view";
import { LoadingPlaceholder } from "../../loading-placeholder";

export const metadata: Metadata = { title: "سؤال من قاعدة البيانات", robots: { index: false, follow: false } };

export default function DatabaseQuestionPage() {
  return <Suspense fallback={<section className="shell section"><LoadingPlaceholder variant="question" /></section>}><DatabaseQuestionView locale="ar" /></Suspense>;
}
