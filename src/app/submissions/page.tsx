import { topics } from "../../content/questions";
import { topicName, messages, type Locale } from "../../i18n";
import { localizedMetadata } from "../metadata";
import { SubmissionForm } from "./submission-form";

export const metadata = localizedMetadata("ar", "/submissions", "إرسال سؤال", "اقترح سؤال مقابلة جديدًا للمراجعة.");

export default function SubmissionsPage({ locale = "ar" }: { locale?: Locale }) {
  const copy = messages[locale];
  return <section className="shell section"><header className="page-header"><span className="eyebrow">{copy.submitEyebrow}</span><h1>{copy.submitTitle}</h1><p>{copy.submitDescription}</p></header><SubmissionForm locale={locale} clerkEnabled={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)} topics={topics.map((topic) => ({ id: topic.id, trackId: topic.trackId, name: topicName(locale, topic.id) }))} /></section>;
}
