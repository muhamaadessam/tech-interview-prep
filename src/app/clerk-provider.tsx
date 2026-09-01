"use client";

import type { ReactNode } from "react";
import { ClerkProvider, useAuth, useClerk, useUser } from "@clerk/react";
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
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  if (!isLoaded || !isSignedIn || !user) return <>{children}</>;
  if (user.primaryEmailAddress?.verification?.status === "verified") return <>{children}</>;
  return <main className="empty-state" aria-live="polite"><h1>أكد بريدك الإلكتروني</h1><p>لازم تأكد بريدك الإلكتروني قبل دخول الموقع.</p><p dir="ltr">Please verify your email address before entering the site.</p><button className="button primary" type="button" onClick={() => openUserProfile()}>{"فتح إعدادات الحساب"}</button></main>;
}
