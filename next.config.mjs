/** @type {import('next').NextConfig} */
const nextConfig = {
  // The engine is a local file: dependency of plain ESM with no build step.
  // Next has to transpile it rather than treat it as a prebuilt package.
  transpilePackages: ["jobfit-engine"],

  // mysql2 is a native-ish driver loaded only on the server, and only when
  // MYSQL_URL is set. Bundling it breaks the build on a machine that will
  // never use it, so it stays external.
  serverExternalPackages: ["mysql2"],
};
export default nextConfig;
