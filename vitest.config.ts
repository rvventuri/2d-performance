import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      include: ["domain/**", "application/**", "infrastructure/**"],
      exclude: [
        "domain/**/repositories/I*.ts",  // Pure TypeScript interfaces — no executable code
        "infrastructure/**/CustomMetricValueRepository.ts", // No test yet — covered by integration
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
