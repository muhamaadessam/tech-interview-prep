"use client";

import { useAuth } from "@clerk/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { messages, type Locale } from "../i18n";
import { hasModeratorAccess } from "../moderation/api";
import { AccountMenu, AuthDialogTrigger } from "./auth-dialog";

const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function ClerkControls({ locale, myTracksHref, moderatorHref }: { locale: Locale; myTracksHref: string; moderatorHref: string }) {
  if (!enabled) return null;
  return <EnabledClerkControls locale={locale} myTracksHref={myTracksHref} moderatorHref={moderatorHref} />;
}

function EnabledClerkControls({ locale, myTracksHref, moderatorHref }: { locale: Locale; myTracksHref: string; moderatorHref: string }) {
  const copy = messages[locale];
  const { isSignedIn, userId, getToken } = useAuth();
  const [moderator, setModerator] = useState(false);

  useEffect(() => {
    let current = true;
    if (!isSignedIn || !userId) { setModerator(false); return; }
    hasModeratorAccess({ userId, getToken }).then((allowed) => { if (current) setModerator(allowed); }).catch(() => { if (current) setModerator(false); });
    return () => { current = false; };
  }, [getToken, isSignedIn, userId]);

  return (
    <div className="auth-controls">
      {!isSignedIn ? <><AuthDialogTrigger locale={locale} className="auth-button">{copy.signIn}</AuthDialogTrigger><AuthDialogTrigger locale={locale} mode="signUp" className="auth-button auth-button-primary">{copy.signUp}</AuthDialogTrigger></> : <><Link className="auth-button" href={myTracksHref}>{copy.myTracks}</Link>{moderator && <Link className="auth-button" href={moderatorHref}>{copy.moderator}</Link>}<AccountMenu locale={locale} myTracksHref={myTracksHref} moderatorHref={moderatorHref} showModerator={false} /></>}
    </div>
  );
}
