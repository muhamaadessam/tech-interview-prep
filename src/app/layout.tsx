import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";
import { siteUrl, themeKey } from "./site-config";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default: "Tech Interview Prep",
    template: "%s | Tech Interview Prep",
  },
  description: "تجهيز منظم لأسئلة مقابلات Flutter التقنية باللغة العربية.",
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

const links = [
  ["الرئيسية", "/"],
  ["الموضوعات", "/topics"],
  ["مكتبة الأسئلة", "/questions"],
  ["مقابلة كاملة", "/interview"],
  ["تقدمي", "/progress"],
] as const;

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
        <a className="skip-link" href="#main-content">
          انتقل إلى المحتوى
        </a>
        <header className="site-header">
          <nav className="shell nav" aria-label="التنقل الرئيسي">
            <Link className="brand" href="/" aria-label="Tech Interview Prep — الرئيسية">
              <span className="brand-mark" aria-hidden="true">T</span>
              <span dir="ltr">Tech Interview Prep</span>
            </Link>
            <div className="nav-links">
              {links.map(([label, href]) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
            </div>
            <ThemeToggle />
          </nav>
        </header>
        <main id="main-content">{children}</main>
        <footer className="shell footer">
          <span dir="ltr">Tech Interview Prep</span>
          <span>محتوى عربي أصلي بمراجع رسمية.</span>
        </footer>
      </body>
    </html>
  );
}
