import { notFound } from "next/navigation";

import HomePage from "../page";
import type { Locale } from "../../content/questions";
import { localizedMetadata } from "../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(locale, "/", locale === "ar" ? "Tech Interview Prep" : "Tech Interview Prep", locale === "ar" ? "تجهيز منظم لأسئلة مقابلات Flutter التقنية باللغة العربية." : "Structured preparation for Flutter technical interviews.");
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <HomePage locale={locale} />;
}
