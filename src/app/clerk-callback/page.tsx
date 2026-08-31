"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/react";

export default function ClerkCallbackPage() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <AuthenticateWithRedirectCallback /> : null;
}
