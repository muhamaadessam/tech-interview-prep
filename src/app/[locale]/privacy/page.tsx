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
    "/privacy",
    locale === "ar" ? "سياسة الخصوصية" : "Privacy policy",
    locale === "ar"
      ? "سياسة الخصوصية لتحضير المقابلات التقنية."
      : "Privacy policy for Tech Interview Prep.",
  );
}

export default async function LocalizedPrivacy({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <LegalPage locale={locale} kind="privacy" />;
}
