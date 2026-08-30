import type { Metadata } from "next";

import { localizedHref, type Locale } from "../i18n";

export function localizedMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: localizedHref(locale, path),
      languages: {
        ar: localizedHref("ar", path),
        en: localizedHref("en", path),
        "x-default": localizedHref("ar", path),
      },
    },
    openGraph: { title, description, locale: locale === "ar" ? "ar_EG" : "en_US" },
  };
}
