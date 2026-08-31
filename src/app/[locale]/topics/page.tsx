import { notFound } from "next/navigation";

import TopicsPage from "../../topics/page";
import type { Locale } from "../../../content/questions";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(locale, "/topics", locale === "ar" ? "الموضوعات" : "Topics", locale === "ar" ? "موضوعات المقابلات في المسار النشط." : "Interview Topics in the Active Track.");
}

export default async function LocalizedTopics({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <TopicsPage locale={locale} />;
}
