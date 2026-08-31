"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { localeDirection, localeFromPathname, localizedHref, messages, type Locale } from "../i18n";
import { ThemeToggle } from "./theme-toggle";
import { BrandLogo } from "./logo";
import { ClerkControls } from "./clerk-controls";

const paths = [["home", "/"], ["topics", "/topics"], ["questions", "/questions"], ["interview", "/interview"], ["progress", "/progress"], ["submit", "/submissions"], ["moderator", "/moderator"]] as const;

function unprefixedPath(pathname: string): string {
  return pathname === "/en" || pathname === "/ar" ? "/" : pathname.replace(/^\/(?:en|ar)(?=\/)/, "") || "/";
}

export function SiteShell({ children }: { children: ReactNode }) {
  const routePathname = usePathname() ?? "/";
  const [pathname, setPathname] = useState(routePathname);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const sync = () => {
      setPathname(window.location.pathname);
      setQuery(window.location.search);
      const locale = localeFromPathname(window.location.pathname);
      document.documentElement.lang = locale;
      document.documentElement.dir = localeDirection(locale);
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("urlchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("urlchange", sync);
    };
  }, []);

  useEffect(() => {
    setPathname(routePathname);
    const nextLocale = localeFromPathname(routePathname);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = localeDirection(nextLocale);
  }, [routePathname]);
  useEffect(() => setQuery(window.location.search), [routePathname]);

  const locale: Locale = localeFromPathname(pathname);
  const copy = messages[locale];
  const targetLocale: Locale = locale === "ar" ? "en" : "ar";
  const switchHref = `${localizedHref(targetLocale, unprefixedPath(pathname))}${query}`;

  return (
    <>
      <a className="skip-link" href="#main-content">{copy.skip}</a>
      <header className="site-header">
        <nav className="shell nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          <Link className="brand" href={localizedHref(locale)} aria-label={`${copy.brandName} — ${copy.home}`}>
            <BrandLogo />
            <span dir={locale === "ar" ? "rtl" : "ltr"}>{copy.brandName}</span>
          </Link>
          <div className="nav-links">
            {paths.map(([key, path]) => <Link key={path} href={localizedHref(locale, path)}>{copy[key]}</Link>)}
          </div>
          <div className="nav-actions">
            <ClerkControls locale={locale} />
            <Link className="locale-switcher" href={switchHref}>{copy.language}</Link>
            <ThemeToggle locale={locale} />
          </div>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="shell footer">
        <span dir="ltr">Tech Interview Prep</span>
        <span>{copy.footer}</span>
      </footer>
    </>
  );
}
