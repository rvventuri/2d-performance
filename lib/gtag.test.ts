import { afterEach, describe, expect, it, vi } from "vitest";
import { gaMeasurementId, gaPageview, sendGtagEvent } from "./gtag";

describe("gaMeasurementId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns undefined when env is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    expect(gaMeasurementId()).toBeUndefined();
  });

  it("returns id when env is set", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    expect(gaMeasurementId()).toBe("G-TEST123");
  });
});

describe("sendGtagEvent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.gtag;
  });

  it("does not throw when gtag is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-X");
    expect(() => sendGtagEvent("login", { method: "email" })).not.toThrow();
  });

  it("calls gtag when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-X");
    const gtag = vi.fn();
    window.gtag = gtag;
    sendGtagEvent("sign_up", { method: "email" });
    expect(gtag).toHaveBeenCalledWith("event", "sign_up", { method: "email" });
  });
});

describe("gaPageview", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.gtag;
  });

  it("calls gtag config with page_path when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-ABC");
    const gtag = vi.fn();
    window.gtag = gtag;
    gaPageview("/dashboard?x=1");
    expect(gtag).toHaveBeenCalledWith("config", "G-ABC", { page_path: "/dashboard?x=1" });
  });
});
