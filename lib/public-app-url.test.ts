import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicAppBaseUrl, getPublicAuthPageUrl } from "./public-app-url";

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
