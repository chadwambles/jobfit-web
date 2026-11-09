/** @type {import('next').NextConfig} */
const nextConfig = {
  // Both of these stay OUT of the bundle and are required at runtime from
  // node_modules.
  //
  // jobfit-engine is here rather than in transpilePackages because it reads
  // its data with readFileSync from a path built out of import.meta.url.
  // Transpiling inlines the module and rewrites import.meta.url to a literal
  // absolute path from the BUILD machine, which does not exist in the
  // serverless runtime, so every request died with a 500. Left external, the
  // URL resolves at runtime against the real node_modules location.
  //
  // mysql2 is a native-ish driver loaded only when MYSQL_URL is set, and
  // bundling it breaks the build on a machine that will never use it.
  serverExternalPackages: ["jobfit-engine", "mysql2"],

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
