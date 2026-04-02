import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { nextRuntime }: { nextRuntime?: string }) {
    // styled-jsx usa __dirname no babel plugin e acaba no bundle Edge Runtime.
    // DefinePlugin substitui __dirname por '/' para que não quebre na Vercel.
    if (nextRuntime === "edge") {
      const { DefinePlugin } = require("webpack");
      config.plugins.push(new DefinePlugin({ __dirname: JSON.stringify("/") }));
    }
    return config;
  },
};

export default nextConfig;
