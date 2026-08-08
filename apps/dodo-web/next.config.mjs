/** @type {import('next').NextConfig} */
const nextConfig = {
  // sprite-core is a local workspace package shipping untranspiled ESM source;
  // have Next compile it as part of the app so the web preview uses the exact
  // same render/palette/extract code as the Electron app.
  transpilePackages: ["sprite-core"],
};

export default nextConfig;
