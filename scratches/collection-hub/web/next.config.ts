import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: join(__dirname, ".."),
  },
};

export default nextConfig;
