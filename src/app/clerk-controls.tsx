"use client";

import { Show, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { messages, type Locale } from "../i18n";
import { hasModeratorAccess } from "../moderation/api";

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
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="auth-button" type="button">{copy.signIn}</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="auth-button auth-button-primary" type="button">{copy.signUp}</button>
        </SignUpButton>
      </Show>
      <Show when="signed-in"><Link className="auth-button" href={myTracksHref}>{copy.myTracks}</Link>{moderator && <Link className="auth-button" href={moderatorHref}>{copy.moderator}</Link>}<UserButton /></Show>
    </div>
  );
}
