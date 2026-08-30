"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClerkRoot({ children }: { children: ReactNode }) {
  return publishableKey ? <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider> : children;
}
