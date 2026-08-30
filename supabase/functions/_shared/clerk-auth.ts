export type JwtClaims = Record<string, unknown>;

export async function pseudonymousUserId(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return `user:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function decodePart(part: string): Uint8Array {
  const normalized = part.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function verifyClerkToken(token: string): Promise<JwtClaims | null> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(decodePart(encodedHeader))) as { alg?: string; kid?: string };
    const claims = JSON.parse(new TextDecoder().decode(decodePart(encodedPayload))) as JwtClaims;
    if (header.alg !== "RS256" || typeof header.kid !== "string" || typeof claims.sub !== "string" || typeof claims.exp !== "number") return null;
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp <= now || (typeof claims.nbf === "number" && claims.nbf > now)) return null;
    const jwksUrl = Deno.env.get("CLERK_JWKS_URL");
    const configuredIssuer = Deno.env.get("CLERK_JWT_ISSUER");
    if (!jwksUrl || !configuredIssuer) return null;
    const jwksResponse = await fetch(jwksUrl);
    if (!jwksResponse.ok) return null;
    const jwks = await jwksResponse.json() as { keys?: Array<JsonWebKey & { kid?: string; alg?: string }> };
    const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.alg === "RS256");
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decodePart(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
    const issuer = configuredIssuer.replace(/\/$/, "");
    return valid && typeof claims.iss === "string" && claims.iss.replace(/\/$/, "") === issuer ? claims : null;
  } catch {
    return null;
  }
}

export async function clerkAuth(request: Request): Promise<{ token: string; claims: JwtClaims } | null> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const claims = await verifyClerkToken(token);
  return claims ? { token, claims } : null;
}

export async function emailConfirmed(userId: string, claims: JwtClaims): Promise<boolean> {
  if (claims.email_verified === true || claims.email_verified === "true") return true;
  const secret = Deno.env.get("CLERK_SECRET_KEY");
  if (!secret) return false;
  const result = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" } });
  if (!result.ok) return false;
  const user = await result.json() as { primary_email_address_id?: string; email_addresses?: Array<{ id?: string; verification?: { status?: string } }> };
  return Boolean(user.email_addresses?.some((email) => email.id === user.primary_email_address_id && email.verification?.status === "verified"));
}
