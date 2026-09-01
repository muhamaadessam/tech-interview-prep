import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const roots = [".next/static", "out", "src"].filter((root) => existsSync(root));
const forbidden = /(?:SUPABASE_SERVICE_ROLE_KEY|CLERK_SECRET_KEY|GITHUB_APP_PRIVATE_KEY|OPENAI_API_KEY|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9_]+)/;
const directDatabaseTransport = /(?:NEXT_PUBLIC_SUPABASE|@supabase\/supabase-js|\/rest\/v1|\/functions\/v1)/;
const files = [];
function walk(root) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
}

for (const root of roots) await walk(root);
const leaks = files.filter((file) => forbidden.test(readFileSync(file, "utf8")));
const direct = files.filter((file) => !file.endsWith(".test.ts") && directDatabaseTransport.test(readFileSync(file, "utf8")));
if (leaks.length) {
  console.error(`Privileged values detected in public files:\n${leaks.join("\n")}`);
  process.exitCode = 1;
} else if (direct.length) {
  console.error(`Direct database transport detected in browser files:\n${direct.join("\n")}`);
  process.exitCode = 1;
} else console.log(`Public secret and transport scan passed (${files.length} files).`);
