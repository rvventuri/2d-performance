import { describe, it, expect, vi, beforeEach } from "vitest";

const createClient = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient,
}));

describe("lib/supabase/admin", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("createAdminClient lança sem env", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { createAdminClient } = await import("./admin");
    expect(() => createAdminClient()).toThrow("ausente");
  });

  it("createAdminClient retorna cliente", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    createClient.mockReturnValue({ from: vi.fn() });
    const { createAdminClient } = await import("./admin");
    expect(createAdminClient()).toBeDefined();
  });

  it("getAdminClientOrNull retorna null sem service key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { getAdminClientOrNull } = await import("./admin");
    expect(getAdminClientOrNull()).toBeNull();
  });

  it("getAdminClientOrNull retorna cliente", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    createClient.mockReturnValue({ x: 1 });
    const { getAdminClientOrNull } = await import("./admin");
    expect(getAdminClientOrNull()).toEqual({ x: 1 });
  });
});
