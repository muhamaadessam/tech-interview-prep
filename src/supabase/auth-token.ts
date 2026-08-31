export type SupabaseTokenProvider = (options?: { template?: string }) => Promise<string | null>;

export async function getSupabaseToken(getToken: SupabaseTokenProvider): Promise<string | null> {
  try {
    return await getToken({ template: "supabase" });
  } catch {
    return getToken();
  }
}
