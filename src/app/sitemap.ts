import type { MetadataRoute } from "next";

import { questions } from "../content/questions";
import { siteUrl } from "./site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/topics", "/questions", "/progress", "/session", "/interview", "/privacy", "/terms"];
  return [
    ...["ar", "en"].flatMap((locale) => pages.map((path) => ({ url: `${siteUrl}/${locale}${path}/`, changeFrequency: "monthly" as const }))),
    ...["ar", "en"].flatMap((locale) => questions.map((question) => ({ url: `${siteUrl}/${locale}/questions/${question.slug}/`, changeFrequency: "monthly" as const }))),
  ];
}
