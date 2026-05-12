import { describe, it, expect, vi, beforeEach } from "vitest";

const createServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("lib/supabase/server createClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  });

  it("cria cliente com cookies", async () => {
    const set = vi.fn();
    const cookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set,
    };
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue(cookieStore as never);

    createServerClient.mockReturnValue({ from: vi.fn() });

    const { createClient } = await import("./server");
    const client = await createClient();
    expect(createServerClient).toHaveBeenCalled();
    expect(client).toBeDefined();

    const [, , options] = createServerClient.mock.calls[0];
    expect(options.cookies.getAll()).toEqual([]);
    expect(cookieStore.getAll).toHaveBeenCalled();

    options.cookies.setAll([{ name: "a", value: "b", options: {} }]);
    expect(set).toHaveBeenCalled();

    set.mockImplementation(() => {
      throw new Error("read-only");
    });
    expect(() =>
      options.cookies.setAll([{ name: "c", value: "d", options: {} }])
    ).not.toThrow();
  });
});
