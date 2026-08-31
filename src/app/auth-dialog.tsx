"use client";

import { useAuth, useClerk, useSignIn, useSignUp, useUser } from "@clerk/react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { messages, type Locale } from "../i18n";

type AuthMode = "signIn" | "signUp" | "verify";

function errorMessage(error: unknown, fallback: string): string {
  const first = (error as { errors?: Array<{ longMessage?: string; message?: string }> } | null)?.errors?.[0];
  return first?.longMessage || first?.message || fallback;
}

export function AuthDialogTrigger({ locale, children, className = "button primary", mode = "signIn" }: { locale: Locale; children?: ReactNode; className?: string; mode?: "signIn" | "signUp" }) {
  const copy = messages[locale];
  const [open, setOpen] = useState(false);
  return <>
    <button className={className} type="button" onClick={() => setOpen(true)}>{children ?? (mode === "signIn" ? copy.signIn : copy.signUp)}</button>
    {open && <AuthDialog locale={locale} initialMode={mode} onClose={() => setOpen(false)} />}
  </>;
}

function AuthDialog({ locale, initialMode, onClose }: { locale: Locale; initialMode: "signIn" | "signUp"; onClose: () => void }) {
  const copy = messages[locale];
  const { isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { heading.current?.focus(); }, [mode]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);

  const text = locale === "ar"
    ? { signIn: "تسجيل الدخول", signUp: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", google: "المتابعة باستخدام Google", submitIn: "دخول", submitUp: "إنشاء الحساب", verify: "تأكيد البريد الإلكتروني", verifyHint: "اكتب الرمز الذي وصلك على بريدك الإلكتروني.", code: "رمز التحقق", confirm: "تأكيد", switchUp: "ليس لديك حساب؟ إنشاء حساب", switchIn: "لديك حساب بالفعل؟ تسجيل الدخول", loading: "جاري التحميل…", failed: "تعذر إكمال العملية. حاول مرة أخرى." }
    : { signIn: "Sign in", signUp: "Create account", email: "Email address", password: "Password", google: "Continue with Google", submitIn: "Sign in", submitUp: "Create account", verify: "Confirm your email", verifyHint: "Enter the code sent to your email.", code: "Verification code", confirm: "Confirm", switchUp: "New here? Create an account", switchIn: "Already have an account? Sign in", loading: "Loading…", failed: "We couldn't complete that. Try again." };

  async function google() {
    if (!isLoaded) return;
    setBusy(true); setError("");
    try {
      const callback = `${window.location.origin}/clerk-callback`;
      const complete = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      const flow = mode === "signUp" ? signUp : signIn;
      const { error: resultError } = await flow.sso({ strategy: "oauth_google", redirectUrl: complete, redirectCallbackUrl: callback });
      if (resultError) throw resultError;
    } catch (caught) { setBusy(false); setError(errorMessage(caught, text.failed)); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded) return;
    setBusy(true); setError("");
    try {
      if (mode === "signIn") {
        const { error: resultError } = await signIn.password({ identifier: email, password });
        if (resultError) throw resultError;
        if (signIn.status === "complete") await signIn.finalize({ navigate: ({ decorateUrl }) => { window.location.href = decorateUrl(window.location.pathname + window.location.search); } });
        else setError(text.failed);
      } else if (mode === "signUp") {
        const { error: resultError } = await signUp.password({ emailAddress: email, password });
        if (resultError) throw resultError;
        if (signUp.status === "missing_requirements" && signUp.unverifiedFields.includes("email_address")) {
          const { error: verificationError } = await signUp.verifications.sendEmailCode();
          if (verificationError) throw verificationError;
          setMode("verify");
        } else setError(text.failed);
      } else {
        const { error: verificationError } = await signUp.verifications.verifyEmailCode({ code });
        if (verificationError) throw verificationError;
        if (signUp.status === "complete") await signUp.finalize({ navigate: ({ decorateUrl }) => { window.location.href = decorateUrl(window.location.pathname + window.location.search); } });
        else setError(text.failed);
      }
    } catch (caught) { setError(errorMessage(caught, text.failed)); }
    finally { setBusy(false); }
  }

  const title = mode === "verify" ? text.verify : mode === "signIn" ? text.signIn : text.signUp;
  return <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="auth-dialog" onMouseDown={(event) => event.stopPropagation()}>
      <button className="auth-dialog-close" type="button" onClick={onClose} aria-label={copy.close}>×</button>
      <span className="eyebrow">{copy.brandName}</span>
      <h2 id="auth-dialog-title" ref={heading} tabIndex={-1}>{title}</h2>
      {mode !== "verify" && <>
        <button className="auth-google-button" type="button" onClick={() => void google()} disabled={busy}><span aria-hidden="true">G</span>{text.google}</button>
        <div className="auth-separator" aria-hidden="true"><span>{locale === "ar" ? "أو" : "or"}</span></div>
      </>}
      <form onSubmit={(event) => void submit(event)}>
        {mode !== "verify" ? <>
          <label>{text.email}<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>{text.password}<input type="password" autoComplete={mode === "signIn" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
        </> : <><p className="field-hint">{text.verifyHint}</p><label>{text.code}<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required /></label></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary auth-submit" type="submit" disabled={busy || !isLoaded}>{busy ? text.loading : mode === "verify" ? text.confirm : mode === "signIn" ? text.submitIn : text.submitUp}</button>
      </form>
      {mode !== "verify" && <button className="auth-switch" type="button" onClick={() => { setError(""); setMode((current) => current === "signIn" ? "signUp" : "signIn"); }}>{mode === "signIn" ? text.switchUp : text.switchIn}</button>}
    </section>
  </div>;
}

export function AccountMenu({ locale, myTracksHref, moderatorHref, showModerator }: { locale: Locale; myTracksHref: string; moderatorHref: string; showModerator: boolean }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "";
  const displayName = user?.fullName || user?.username || email || "User";
  const username = user?.username ? `@${user.username}` : "";
  const initial = (displayName || "U").slice(0, 1).toUpperCase();
  const copy = messages[locale];
  return <div className="auth-account">
    <button className="auth-profile-trigger" type="button" aria-label={`${copy.account}: ${displayName}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
      <span className="auth-avatar" aria-hidden="true">{user?.imageUrl ? <img src={user.imageUrl} alt="" referrerPolicy="no-referrer" /> : initial}</span>
      <span className="auth-profile-name">{displayName}</span>
    </button>
    {open && <div className="auth-account-menu" role="menu">
      <div className="auth-account-profile">
        <strong>{displayName}</strong>
        {username && <span dir="ltr">{username}</span>}
        {email && <span dir="ltr">{email}</span>}
      </div>
      <Link href={myTracksHref} role="menuitem" onClick={() => setOpen(false)}>{copy.myTracks}</Link>
      {showModerator && <Link href={moderatorHref} role="menuitem" onClick={() => setOpen(false)}>{copy.moderator}</Link>}
      <button type="button" role="menuitem" onClick={() => void signOut()}>{locale === "ar" ? "تسجيل الخروج" : "Sign out"}</button>
    </div>}
  </div>;
}
