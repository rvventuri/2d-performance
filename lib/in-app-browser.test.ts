import { describe, expect, it } from "vitest";
import { detectLikelyEmbeddedBrowser } from "./in-app-browser";

describe("detectLikelyEmbeddedBrowser", () => {
  it("returns false for empty or desktop Chrome", () => {
    expect(detectLikelyEmbeddedBrowser(undefined)).toBe(false);
    expect(detectLikelyEmbeddedBrowser("")).toBe(false);
    expect(
      detectLikelyEmbeddedBrowser(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      )
    ).toBe(false);
  });

  it("detects LinkedIn in-app patterns", () => {
    expect(
      detectLikelyEmbeddedBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 LinkedInApp/9.24.0"
      )
    ).toBe(true);
    expect(
      detectLikelyEmbeddedBrowser(
        "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 LinkedIn/4.1.23"
      )
    ).toBe(true);
  });

  it("detects other common embedded browsers", () => {
    expect(
      detectLikelyEmbeddedBrowser("Mozilla/5.0 Instagram 123.0.0.0.0 Android")
    ).toBe(true);
    expect(
      detectLikelyEmbeddedBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/400.0.0;]"
      )
    ).toBe(true);
  });
});
