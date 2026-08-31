"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import Link from "next/link";

import { localizedHref, messages, type Locale } from "../i18n";

const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function ClerkControls({ locale }: { locale: Locale }) {
  if (!enabled) return null;
  const copy = messages[locale];

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
      <Show when="signed-in"><Link className="auth-button" href={localizedHref(locale, "/my-tracks")}>{copy.myTracks}</Link><UserButton /></Show>
    </div>
  );
}
