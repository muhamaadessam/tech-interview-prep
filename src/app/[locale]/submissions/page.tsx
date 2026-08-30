import { notFound } from "next/navigation";

import SubmissionsPage from "../../submissions/page";
import type { Locale } from "../../../content/questions";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(locale, "/submissions", locale === "ar" ? "إرسال سؤال" : "Submit a question", locale === "ar" ? "اقترح سؤال مقابلة جديدًا للمراجعة." : "Suggest a new interview question for review.");
}

export default async function LocalizedSubmissions({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <SubmissionsPage locale={locale} />;
}
