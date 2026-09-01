import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const forbidden = [
  "NEXT_PUBLIC_SUPABASE",
  "@supabase/supabase-js",
  "/rest/v1",
  "/functions/v1",
  "getSupabaseToken",
];

async function productionFiles(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return productionFiles(url);
    return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [url] : [];
  }));
  return nested.flat();
}

test("browser production code has no direct Supabase transport", async () => {
  const files = await productionFiles(new URL("../", import.meta.url));
  const offenders: string[] = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const marker of forbidden) if (source.includes(marker)) offenders.push(`${file.pathname}: ${marker}`);
  }
  assert.deepEqual(offenders, []);
});
