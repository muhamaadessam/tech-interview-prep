import { localizedMetadata } from "../metadata";
import { ModeratorConsole } from "./moderator-console";

export const metadata = localizedMetadata("ar", "/moderator", "لوحة المراجعة", "مراجعة مساهمات المجتمع.");

export default function ModeratorPage({ locale = "ar" }: { locale?: "ar" | "en" }) {
  const english = locale === "en";
  return <section className="shell section"><header className="page-header"><span className="eyebrow">{english ? "Moderator console" : "لوحة المشرف"}</span><h1>{english ? "Review community submissions" : "راجع مساهمات المجتمع"}</h1><p>{english ? "Review the oldest submissions first and leave a clear reason for every decision." : "راجع المساهمات الأقدم أولًا واكتب سببًا واضحًا لكل قرار."}</p></header><ModeratorConsole locale={locale} clerkEnabled={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)} /></section>;
}
