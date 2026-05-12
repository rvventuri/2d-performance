import { describe, it, expect, vi, afterEach } from "vitest";
import { getSiteUrl, SITE_URL_FALLBACK } from "./site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa NEXT_PUBLIC_APP_URL sem barra final", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com/");
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("usa fallback sem env", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getSiteUrl()).toBe(SITE_URL_FALLBACK);
  });
});
