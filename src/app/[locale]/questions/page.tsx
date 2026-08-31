import { notFound } from "next/navigation";

import QuestionsPage from "../../questions/page";
import type { Locale } from "../../../content/questions";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(locale, "/questions", locale === "ar" ? "مكتبة الأسئلة" : "Question library", locale === "ar" ? "مكتبة أسئلة المقابلات في المسار النشط." : "Interview Questions in the Active Track.");
}

export default async function LocalizedQuestions({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <QuestionsPage locale={locale} />;
}
