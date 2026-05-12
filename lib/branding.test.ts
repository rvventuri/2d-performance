import { describe, it, expect } from "vitest";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "./branding";

describe("branding", () => {
  it("exporta strings canônicas", () => {
    expect(APP_NAME).toBe("SaltoVerse");
    expect(APP_DESCRIPTION.length).toBeGreaterThan(10);
    expect(APP_TAGLINE).toContain("SaltoVerse");
  });
});
