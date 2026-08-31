import { notFound } from "next/navigation";

import ModeratorPage from "../../moderator/page";
import { localizedMetadata } from "../../metadata";

export function generateStaticParams() { return [{ locale: "ar" }, { locale: "en" }]; }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) { const locale = (await params).locale; return localizedMetadata(locale === "en" ? "en" : "ar", "/moderator", locale === "en" ? "Moderator console" : "لوحة المراجعة", locale === "en" ? "Review community submissions." : "مراجعة مساهمات المجتمع."); }
export default async function LocalizedModerator({ params }: { params: Promise<{ locale: string }> }) { const locale = (await params).locale; if (locale !== "ar" && locale !== "en") notFound(); return <ModeratorPage locale={locale} />; }
