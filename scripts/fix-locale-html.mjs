import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

for (const locale of ["ar", "en"]) {
  const directory = join("out", locale);
  for (const file of await htmlFiles(directory)) {
    const html = await readFile(file, "utf8");
    const updated = html.replace(/<html lang="[^"]+" dir="[^"]+"/, `<html lang="${locale}" dir="${locale === "en" ? "ltr" : "rtl"}"`);
    if (updated !== html) await writeFile(file, updated);
  }
}
