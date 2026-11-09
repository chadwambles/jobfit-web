/** @type {import('next').NextConfig} */
const nextConfig = {
  // The engine is a local file: dependency of plain ESM with no build step.
  // Next has to transpile it rather than treat it as a prebuilt package.
  transpilePackages: ["jobfit-engine"],

  // mysql2 is a native-ish driver loaded only on the server, and only when
  // MYSQL_URL is set. Bundling it breaks the build on a machine that will
  // never use it, so it stays external.
  serverExternalPackages: ["mysql2"],

  // The engine reads its vocabularies and O*NET artifacts with readFileSync
  // from a path built from import.meta.url at runtime. Next's tracer follows
  // imports, not runtime string paths, so without this the deployed function
  // ships without data/ and dies on the first request. Verified by checking
  // the generated .nft.json after a build.
  outputFileTracingIncludes: {
    "/api/analyze": ["./node_modules/jobfit-engine/data/**"],
    "/api/cache": ["./node_modules/jobfit-engine/data/**"],
  },
};
export default nextConfig;
