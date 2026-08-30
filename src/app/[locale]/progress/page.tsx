import { notFound } from "next/navigation";

import ProgressPage from "../../progress/page";
import type { Locale } from "../../../content/questions";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(locale, "/progress", locale === "ar" ? "تقدمي" : "Progress", locale === "ar" ? "تقدمك في مراجعة أسئلة Flutter." : "Your Flutter interview study progress.");
}

export default async function LocalizedProgress({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <ProgressPage locale={locale} />;
}
