# Node.js backend

The only application server is the Fastify Node.js app in `backend/`. The root
Next.js project is a static frontend (`output: "export"`) and has no API routes,
server actions, database client, or server credentials.

Production deploys use `backend` as the Vercel root directory. Build and run it
with:

```sh
npm run build
npm start
```

Supabase is used only by this Node process as the PostgreSQL provider. Its
credentials and privileged integrations never belong in the frontend package.
