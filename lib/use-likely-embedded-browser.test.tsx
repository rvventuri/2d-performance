import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLikelyEmbeddedBrowser } from "@/lib/use-likely-embedded-browser";

vi.mock("@/lib/in-app-browser", () => ({
  detectLikelyEmbeddedBrowser: vi.fn(),
}));

import { detectLikelyEmbeddedBrowser } from "@/lib/in-app-browser";

describe("useLikelyEmbeddedBrowser", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { userAgent: "Instagram" });
    vi.clearAllMocks();
  });

  it("atualiza estado após microtask", async () => {
    vi.mocked(detectLikelyEmbeddedBrowser).mockReturnValue(true);
    const { result } = renderHook(() => useLikelyEmbeddedBrowser());
    await waitFor(() => expect(result.current).toBe(true));
    expect(detectLikelyEmbeddedBrowser).toHaveBeenCalled();
  });
});
