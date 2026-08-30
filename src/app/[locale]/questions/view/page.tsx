import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";

import type { Locale } from "../../../../content/questions";
import { DatabaseQuestionView } from "../../../questions/view/database-question-view";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale;
  return { title: locale === "en" ? "Database question" : "سؤال من قاعدة البيانات", robots: { index: false, follow: false } };
}

export default async function LocalizedDatabaseQuestion({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <Suspense fallback={<section className="shell section"><p>...</p></section>}><DatabaseQuestionView locale={locale} /></Suspense>;
}
