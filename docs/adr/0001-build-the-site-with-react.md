# Build a statically exported Next.js site

The product teaches Flutter but is a public, content-focused website, so we use
Next.js and TypeScript rather than Flutter Web. Every question is generated as a
static page and deployed to Cloudflare Pages. Account-owned features call the
Node backend on Vercel, which is the only application layer allowed to access
Supabase.
