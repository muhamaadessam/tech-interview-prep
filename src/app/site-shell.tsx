"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { localeDirection, localeFromPathname, localizedHref, messages, type Locale } from "../i18n";
import { ThemeToggle } from "./theme-toggle";
import { BrandLogo } from "./logo";
import { ClerkControls } from "./clerk-controls";
import { useActiveTrack } from "./active-track";

const cataloguePaths = [["topics", "/topics"], ["questions", "/questions"], ["interview", "/interview"]] as const;
const activityPaths = [["progress", "/progress"], ["submit", "/submissions"]] as const;

function unprefixedPath(pathname: string): string {
  return pathname === "/en" || pathname === "/ar" ? "/" : pathname.replace(/^\/(?:en|ar)(?=\/)/, "") || "/";
}

export function SiteShell({ children }: { children: ReactNode }) {
  const routePathname = usePathname() ?? "/";
  const [pathname, setPathname] = useState(routePathname);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { trackHref } = useActiveTrack();

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
  const href = (path: string) => localizedHref(locale, trackHref(path));
  const links = <>{cataloguePaths.map(([key, path]) => <Link key={path} href={href(path)} onClick={() => menu.current?.close()}>{copy[key]}</Link>)}<span className="nav-divider" aria-hidden="true" />{activityPaths.map(([key, path]) => <Link key={path} href={href(path)} onClick={() => menu.current?.close()}>{copy[key]}</Link>)}</>;

  function openMenu() {
    menu.current?.showModal();
    setMenuOpen(true);
  }

  return (
    <>
      <a className="skip-link" href="#main-content">{copy.skip}</a>
      <header className="site-header">
        <nav className="shell nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          <Link className="brand" href={href("/")} aria-label={`${copy.brandName} — ${copy.home}`}>
            <BrandLogo />
            <span dir={locale === "ar" ? "rtl" : "ltr"}>{copy.brandName}</span>
          </Link>
          <div className="desktop-navigation">
            <div className="nav-links">{links}</div>
            <div className="nav-actions">
              <ClerkControls locale={locale} myTracksHref={href("/my-tracks")} moderatorHref={href("/moderator")} />
              <Link className="locale-switcher" href={switchHref}>{copy.language}</Link>
              <ThemeToggle locale={locale} />
            </div>
          </div>
          <button ref={menuButton} className="mobile-menu-button" type="button" aria-haspopup="dialog" aria-controls="mobile-navigation" aria-expanded={menuOpen} onClick={openMenu}>{copy.menu}</button>
          <dialog ref={menu} id="mobile-navigation" className="mobile-navigation" aria-labelledby="mobile-navigation-title" onClose={() => { setMenuOpen(false); menuButton.current?.focus(); }}>
            <div className="mobile-navigation-header"><strong id="mobile-navigation-title">{copy.menu}</strong><button className="mobile-menu-close" type="button" autoFocus onClick={() => menu.current?.close()}>{copy.close}</button></div>
            <div className="mobile-navigation-links">{links}</div>
            <div className="mobile-navigation-actions"><ClerkControls locale={locale} myTracksHref={href("/my-tracks")} moderatorHref={href("/moderator")} /><Link className="locale-switcher" href={switchHref} onClick={() => menu.current?.close()}>{copy.language}</Link><ThemeToggle locale={locale} /></div>
          </dialog>
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
