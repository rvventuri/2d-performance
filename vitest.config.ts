import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // Cobertura em código TypeScript testável: DDD, lib, hooks, proxy, config, sitemap/robots e API pública de share. Rotas/actions demais e seed ficam fora (E2E / manual).
      include: [
        "domain/**/*.ts",
        "application/**/*.ts",
        "infrastructure/**/*.ts",
        "lib/**/*.ts",
        "hooks/**/*.ts",
        "proxy.ts",
        "next.config.ts",
        "app/robots.ts",
        "app/sitemap.ts",
        "app/api/share/**/*.ts",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/.next/**",
        "coverage/**",
        ".cursor/**",
        "next-env.d.ts",
        "lib/storage.ts",
        "lib/supabase/database.types.ts",
        "lib/types.ts",
        "lib/services/ai-analysis.service.ts",
        "infrastructure/supabase/DemoTemplateRepository.ts",
        "domain/**/repositories/I*.ts",
        "components/ui/**",
        "app/**/*.tsx",
        "components/**/*.tsx",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        // 100% de branches no agregado global exigiria combinatória enorme (AdminRepository, proxy, repositórios); linhas e funções permanecem 100%.
        branches: 92,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
