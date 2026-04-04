import { describe, expect, it } from "vitest";
import { buildSafariHttpsOpenUrl } from "./safari-external-url";

describe("buildSafariHttpsOpenUrl", () => {
  it("uses x-safari-https scheme", () => {
    expect(buildSafariHttpsOpenUrl("https://2d-performance.vercel.app/login")).toBe(
      "x-safari-https://2d-performance.vercel.app/login"
    );
  });
});
