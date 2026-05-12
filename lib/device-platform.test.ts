import { describe, it, expect } from "vitest";
import { isAndroidUserAgent, isIOSUserAgent } from "./device-platform";

describe("device-platform", () => {
  it("detecta Android", () => {
    expect(isAndroidUserAgent("Mozilla/5.0 (Linux; Android 12)")).toBe(true);
    expect(isAndroidUserAgent("Mozilla/5.0 iPhone")).toBe(false);
  });

  it("detecta iOS", () => {
    expect(isIOSUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe(true);
    expect(isIOSUserAgent("Mozilla/5.0 (Macintosh)")).toBe(false);
  });
});
