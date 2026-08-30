import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { siteUrl, themeKey } from "./site-config";
import { SiteShell } from "./site-shell";

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default: "Tech Interview Prep",
    template: "%s | Tech Interview Prep",
  },
  description: "تجهيز منظم لأسئلة مقابلات Flutter التقنية باللغة العربية.",
  alternates: {
    canonical: "/ar/",
    languages: { ar: "/ar/", en: "/en/", "x-default": "/ar/" },
  },
  openGraph: {
    title: "Tech Interview Prep",
    description: "تجهيز منظم لأسئلة مقابلات Flutter التقنية باللغة العربية.",
    type: "website",
    locale: "ar_EG",
  },
  twitter: {
    card: "summary",
    title: "Tech Interview Prep",
    description: "تجهيز منظم لأسئلة مقابلات Flutter التقنية باللغة العربية.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const s=localStorage.getItem(${JSON.stringify(themeKey)});document.documentElement.dataset.theme=s==="light"||s==="dark"?s:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch{}})()`,
          }}
        />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
