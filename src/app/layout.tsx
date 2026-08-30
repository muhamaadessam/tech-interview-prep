import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tech Interview Prep",
    template: "%s | Tech Interview Prep",
  },
  description: "تجهيز منظم لأسئلة مقابلات Flutter التقنية باللغة العربية.",
};

const links = [
  ["الرئيسية", "/"],
  ["الموضوعات", "/topics"],
  ["مكتبة الأسئلة", "/questions"],
  ["تقدمي", "/progress"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
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
