import { describe, it, expect, vi } from "vitest";
import robots from "./app/robots";
import sitemap from "./app/sitemap";

describe("robots", () => {
  it("gera regras e sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    const r = robots();
    expect(r.rules).toBeDefined();
    expect(r.sitemap).toContain("sitemap.xml");
    vi.unstubAllEnvs();
  });
});

describe("sitemap", () => {
  it("lista URL pública", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    const sm = sitemap();
    expect(sm[0].url).toBe("https://example.com");
    vi.unstubAllEnvs();
  });
});
