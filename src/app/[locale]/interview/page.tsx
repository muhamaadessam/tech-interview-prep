import { notFound } from "next/navigation";

import FullInterviewPage from "../../interview/page";
import type { Locale } from "../../../content/questions";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(locale, "/interview", locale === "ar" ? "مقابلة كاملة" : "Full interview", locale === "ar" ? "مقابلة Flutter شاملة." : "A complete Flutter technical interview.");
}

export default async function LocalizedInterview({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <FullInterviewPage locale={locale} />;
}
