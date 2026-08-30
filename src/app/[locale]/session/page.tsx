import { notFound } from "next/navigation";

import SessionPage from "../../session/page";
import type { Locale } from "../../../content/questions";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(locale, "/session", locale === "ar" ? "جلسة مراجعة" : "Review session", locale === "ar" ? "جلسة مراجعة لأسئلة Flutter." : "A focused Flutter interview review session.");
}

export default async function LocalizedSession({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <SessionPage locale={locale} />;
}
