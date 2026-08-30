"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/react";

export default function ClerkCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
