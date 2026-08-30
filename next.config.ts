import type { NextConfig } from "next";

const repositoryName = "tech-interview-prep";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NODE_ENV === "production" ? `/${repositoryName}` : "",
};

export default nextConfig;
