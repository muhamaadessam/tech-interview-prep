"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};
const signedIn = () => typeof window !== "undefined" && localStorage.getItem("playwright-authenticated") === "true";
const useSignedIn = () => useSyncExternalStore(subscribe, signedIn, () => false);
const getToken = async () => "playwright-token";

export function ClerkProvider({ children }: { children: ReactNode }) { return children; }
export function useAuth() {
  const isSignedIn = useSignedIn();
  return { isLoaded: true, isSignedIn, userId: isSignedIn ? "user_playwright" : null, getToken };
}
export function useUser() {
  const verified = typeof window === "undefined" || localStorage.getItem("playwright-email-verified") !== "false";
  return { user: { primaryEmailAddress: { verification: { status: verified ? "verified" : "unverified" } } } };
}
export function Show({ when, children }: { when: "signed-in" | "signed-out"; children: ReactNode }) {
  const isSignedIn = useSignedIn();
  return (when === "signed-in") === isSignedIn ? children : null;
}
export function SignInButton({ children }: { children: ReactNode }) { return children; }
export function SignUpButton({ children }: { children: ReactNode }) { return children; }
export function UserButton() { return null; }
export function AuthenticateWithRedirectCallback() { return null; }
