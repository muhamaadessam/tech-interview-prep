import { questions, topics } from "../../content/questions";
import { FullInterview } from "./full-interview";
import type { Locale } from "../../content/questions";
import { localizedMetadata } from "../metadata";

export const metadata = localizedMetadata("ar", "/interview", "مقابلة كاملة", "مقابلة شاملة في المسار النشط.");

export default function FullInterviewPage({ locale = "ar" }: { locale?: Locale }) {
  return <FullInterview questions={questions} topics={topics} locale={locale} />;
}
