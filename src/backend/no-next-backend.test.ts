import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

async function files(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    return entry.isDirectory() ? files(url) : /\.(?:ts|tsx)$/.test(entry.name) ? [url] : [];
  }))).flat();
}

test("Next source is frontend-only", async () => {
  const offenders: string[] = [];
  for (const file of await files(new URL("../app/", import.meta.url))) {
    const source = await readFile(file, "utf8");
    if (/NextRequest|NextResponse|from ["']next\/server["']|export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/.test(source)) offenders.push(file.pathname);
  }
  assert.deepEqual(offenders, []);
});
