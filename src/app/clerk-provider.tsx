"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ClerkProvider, useAuth, useClerk } from "@clerk/react";
import { nodeRequest } from "../backend/api.ts";
import { StudySync } from "./study-sync";
import { TrackPreferencesGate } from "./track-preferences";
import { AnonymousActiveTrackProvider, AuthenticatedActiveTrackProvider } from "./active-track";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClerkRoot({ children }: { children: ReactNode }) {
  return publishableKey
    ? <ClerkProvider publishableKey={publishableKey}><EmailVerificationGate><AuthenticatedActiveTrackProvider><StudySync /><TrackPreferencesGate />{children}</AuthenticatedActiveTrackProvider></EmailVerificationGate></ClerkProvider>
    : <AnonymousActiveTrackProvider>{children}</AnonymousActiveTrackProvider>;
}

function EmailVerificationGate({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { openUserProfile } = useClerk();
  const [verified, setVerified] = useState<boolean | null>(null);
  const checkVerification = useCallback(async () => {
    setVerified(null);
    try {
      const token = await getToken();
      const result = await nodeRequest<{ verified: boolean }>({ path: "/me/email-verification", token: token ?? undefined });
      setVerified(result.verified === true);
    } catch {
      setVerified(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return undefined;
    void checkVerification();
    const onVisibilityChange = () => { if (document.visibilityState === "visible") void checkVerification(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [checkVerification, isLoaded, isSignedIn]);

  if (!isLoaded) return <main className="empty-state" aria-live="polite"><p>جارٍ تحميل الحساب…</p><p dir="ltr">Loading account…</p></main>;
  if (!isSignedIn) return <>{children}</>;
  if (verified === true) return <>{children}</>;
  if (verified === null) return <main className="empty-state" aria-live="polite"><p>جارٍ التحقق من الحساب…</p><p dir="ltr">Checking account verification…</p></main>;
  return <main className="empty-state" aria-live="polite"><h1>أكد بريدك الإلكتروني</h1><p>لازم تأكد بريدك الإلكتروني قبل دخول الموقع.</p><p dir="ltr">Please verify your email address before entering the site.</p><button className="button primary" type="button" onClick={() => openUserProfile()}>{"فتح إعدادات الحساب"}</button><button className="button" type="button" onClick={() => void checkVerification()}>إعادة التحقق</button></main>;
}
