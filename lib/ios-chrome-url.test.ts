import { describe, expect, it } from "vitest";
import { buildIOSChromeHttpsUrl } from "./ios-chrome-url";

describe("buildIOSChromeHttpsUrl", () => {
  it("uses googlechromes scheme with host and path", () => {
    expect(buildIOSChromeHttpsUrl("https://2d-performance.vercel.app/login")).toBe(
      "googlechromes://2d-performance.vercel.app/login"
    );
  });
});
