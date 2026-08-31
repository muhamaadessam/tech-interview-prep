import type { NextConfig } from "next";

const repositoryName = "tech-interview-prep";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.GITHUB_PAGES === "true" ? `/${repositoryName}` : "",
  turbopack: process.env.PLAYWRIGHT_MOCK_AUTH === "true" ? { resolveAlias: { "@clerk/react": "#clerk-react-mock" } } : undefined,
};

export default nextConfig;
