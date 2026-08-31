import { localizedMetadata } from "../metadata";
import { messages, type Locale } from "../../i18n";
import { MyTracks } from "../track-preferences";

export const metadata = localizedMetadata("ar", "/my-tracks", "مساراتي", "إدارة تفضيلات المسارات والمسار الافتراضي.");

export default function MyTracksPage({ locale = "ar" }: { locale?: Locale }) {
  const copy = messages[locale];
  return <section className="shell section"><header className="page-header"><span className="eyebrow">{copy.onboardingEyebrow}</span><h1>{copy.myTracksTitle}</h1><p>{copy.myTracksDescription}</p></header><MyTracks locale={locale} clerkEnabled={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)} /></section>;
}
