import { describe, it, expect } from "vitest";
import { cn, formatDate, formatDateShort } from "./utils";

describe("cn", () => {
  it("mescla classes", () => {
    expect(cn("a", false && "b", "c")).toMatch(/a/);
    expect(cn("a", "c")).toContain("a");
  });
});

describe("formatDate", () => {
  it("formata ISO em pt-BR", () => {
    expect(formatDate("2025-03-05")).toMatch(/03/);
    expect(formatDate("2025-03-05")).toMatch(/2025/);
  });
});

describe("formatDateShort", () => {
  it("formata mês curto", () => {
    const s = formatDateShort("2025-06-12T12:00:00");
    expect(s).toMatch(/jun/i);
  });
});
