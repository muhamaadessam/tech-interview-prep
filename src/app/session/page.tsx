import { questions, topics } from "../../content/questions";
import { StudySession } from "./study-session";
import type { Locale } from "../../content/questions";
import { localizedMetadata } from "../metadata";

export const metadata = localizedMetadata("ar", "/session", "جلسة مراجعة", "جلسة مراجعة لأسئلة Flutter.");

export default function SessionPage({ locale = "ar" }: { locale?: Locale }) {
  return <StudySession questions={questions} topics={topics} locale={locale} />;
}
