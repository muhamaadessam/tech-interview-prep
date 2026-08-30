import { notFound } from "next/navigation";

import QuestionDetailsPage from "../../../questions/[slug]/page";
import { getQuestion, getQuestionTranslation, questions, type Locale } from "../../../../content/questions";
import { localizedMetadata } from "../../../metadata";

export function generateStaticParams() {
  return ["ar", "en"].flatMap((locale) => questions.map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const values = await params;
  const locale = values.locale as Locale;
  const question = getQuestion(values.slug);
  if (!question) return { title: locale === "en" ? "Question not found" : "السؤال غير موجود" };
  const translation = getQuestionTranslation(question, locale);
  return localizedMetadata(locale, `/questions/${question.slug}`, translation.question, translation.shortAnswer);
}

export default async function LocalizedQuestion({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const values = await params;
  const locale = values.locale as Locale;
  if (locale !== "ar" && locale !== "en") notFound();
  return <QuestionDetailsPage params={Promise.resolve({ slug: values.slug })} locale={locale} />;
}
