import { describe, it, expect, vi, beforeEach } from "vitest";

const createBrowserClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient,
}));

describe("lib/supabase/client createClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  });

  it("instancia browser client", async () => {
    createBrowserClient.mockReturnValue({ auth: {} });
    const { createClient } = await import("./client");
    expect(createClient()).toEqual({ auth: {} });
    expect(createBrowserClient).toHaveBeenCalledWith("https://x.supabase.co", "anon");
  });
});
