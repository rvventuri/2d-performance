import { describe, it, expect } from "vitest";
import nextConfig from "./next.config";

describe("next.config", () => {
  it("exporta remotePatterns e headers", async () => {
    expect(nextConfig.images?.remotePatterns?.[0]?.hostname).toContain("supabase");
    const headers = await nextConfig.headers?.();
    expect(headers?.[0].headers.some((h) => h.key === "X-Frame-Options")).toBe(true);
  });
});
