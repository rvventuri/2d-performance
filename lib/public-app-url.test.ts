import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMarketingCtaHref,
  getPublicAppBaseUrl,
  getPublicAuthPageUrl,
} from "./public-app-url";

describe("getMarketingCtaHref", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns absolute URL when NEXT_PUBLIC_APP_URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://2d-performance.vercel.app");
    expect(getMarketingCtaHref("/login")).toBe("https://2d-performance.vercel.app/login");
    expect(getMarketingCtaHref("/register")).toBe(
      "https://2d-performance.vercel.app/register"
    );
  });

  it("remove barra final da base", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://2d-performance.vercel.app/");
    expect(getMarketingCtaHref("/login")).toBe("https://2d-performance.vercel.app/login");
  });

  it("returns relative path when env is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getMarketingCtaHref("/login")).toBe("/login");
  });

  it("trata base só com espaços como relativo", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "   ");
    expect(getMarketingCtaHref("/login")).toBe("/login");
  });
});

describe("getPublicAppBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_APP_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://2d-performance.vercel.app/");
    expect(getPublicAppBaseUrl()).toBe("https://2d-performance.vercel.app");
  });

  it("falls back to window.location.origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getPublicAppBaseUrl()).toBe("http://localhost:3000");
  });
});

describe("getPublicAuthPageUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("appends path to base", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://2d-performance.vercel.app");
    expect(getPublicAuthPageUrl("/login")).toBe("https://2d-performance.vercel.app/login");
    expect(getPublicAuthPageUrl("/register")).toBe(
      "https://2d-performance.vercel.app/register"
    );
  });
});
