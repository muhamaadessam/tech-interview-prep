import type { MetadataRoute } from "next";

import { questions } from "../content/questions";
import { siteUrl } from "./site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/topics", "/questions", "/progress", "/session", "/interview"];
  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}/`, changeFrequency: "monthly" as const })),
    ...questions.map((question) => ({ url: `${siteUrl}/questions/${question.slug}/`, changeFrequency: "monthly" as const })),
  ];
}
