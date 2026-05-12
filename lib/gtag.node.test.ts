// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

describe("gtag no SSR (sem window)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("gaPageview e sendGtagEvent são no-op", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-X");
    vi.resetModules();
    const { gaPageview, sendGtagEvent } = await import("./gtag");
    expect(() => gaPageview("/x")).not.toThrow();
    expect(() => sendGtagEvent("login")).not.toThrow();
  });
});
