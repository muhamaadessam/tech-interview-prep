import type { MetadataRoute } from "next";

import { questions } from "../content/questions";

const siteUrl = "https://muhamaadessam.github.io/tech-interview-prep";
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/topics", "/questions", "/progress", "/session"];
  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}/`, changeFrequency: "monthly" as const })),
    ...questions.map((question) => ({ url: `${siteUrl}/questions/${question.slug}/`, changeFrequency: "monthly" as const })),
  ];
}
