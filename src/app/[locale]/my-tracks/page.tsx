import { notFound } from "next/navigation";

import type { Locale } from "../../../i18n";
import MyTracksPage from "../../my-tracks/page";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  return localizedMetadata(locale, "/my-tracks", locale === "ar" ? "مساراتي" : "My Tracks", locale === "ar" ? "إدارة تفضيلات المسارات والمسار الافتراضي." : "Manage Track Preferences and the Default Track.");
}

export default async function LocalizedMyTracks({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <MyTracksPage locale={locale} />;
}
