import { notFound } from "next/navigation";

import type { Locale } from "../../../content/questions";
import { LegalPage } from "../../legal-page";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(
    locale,
    "/terms",
    locale === "ar" ? "شروط الاستخدام" : "Terms of use",
    locale === "ar"
      ? "شروط استخدام تحضير المقابلات التقنية."
      : "Terms of use for Tech Interview Prep.",
  );
}

export default async function LocalizedTerms({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <LegalPage locale={locale} kind="terms" />;
}
