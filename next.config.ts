import type { NextConfig } from "next";

const repositoryName = "tech-interview-prep";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.GITHUB_PAGES === "true" ? `/${repositoryName}` : "",
};

export default nextConfig;
