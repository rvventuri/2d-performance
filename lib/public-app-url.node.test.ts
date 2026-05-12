// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";

describe("getPublicAppBaseUrl (sem window)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("retorna string vazia no SSR quando env ausente", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.resetModules();
    const { getPublicAppBaseUrl } = await import("./public-app-url");
    expect(getPublicAppBaseUrl()).toBe("");
  });

  it("getPublicAuthPageUrl retorna vazio quando base SSR está vazia", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.resetModules();
    const { getPublicAuthPageUrl } = await import("./public-app-url");
    expect(getPublicAuthPageUrl("/login")).toBe("");
  });

  it("getMarketingCtaHref sem variável de ambiente retorna path relativo", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.resetModules();
    const { getMarketingCtaHref } = await import("./public-app-url");
    expect(getMarketingCtaHref("/login")).toBe("/login");
  });
});
