import type { NextConfig } from "next";

// GLSL lives in its own files so shaders get editor highlighting and clean diffs.
const glslRule = { loaders: ["raw-loader"], as: "*.js" };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.vert": glslRule,
      "*.frag": glslRule,
    },
  },
};

export default nextConfig;
