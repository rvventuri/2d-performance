import { describe, expect, it } from "vitest";
import { buildChromeHttpsIntentUrl } from "./android-chrome-intent";

describe("buildChromeHttpsIntentUrl", () => {
  it("builds intent with host, path and fallback", () => {
    const url = "https://2d-performance.vercel.app/login";
    const intent = buildChromeHttpsIntentUrl(url);
    expect(intent).toContain("intent://2d-performance.vercel.app/login#Intent");
    expect(intent).toContain("scheme=https");
    expect(intent).toContain("package=com.android.chrome");
    expect(intent).toContain(
      "S.browser_fallback_url=https%3A%2F%2F2d-performance.vercel.app%2Flogin"
    );
  });
});
