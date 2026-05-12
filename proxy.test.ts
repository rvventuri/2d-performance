import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";

describe("proxy", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("passa sem env Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const req = new NextRequest("http://localhost/dashboard");
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it("redireciona usuário logado em /login para dashboard", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } });
    createServerClient.mockReturnValue({
      auth: { getUser },
    });
    const req = new NextRequest("http://localhost/login");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("/login sem sessão retorna next", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const req = new NextRequest("http://localhost/login");
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it("redireciona não autenticado para login", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const req = new NextRequest("http://localhost/dashboard");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/login/);
  });

  it("prefixo /administration aplica mesma regra de admin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1", app_metadata: {} } },
        }),
      },
    });
    const req = new NextRequest("http://localhost/administration");
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("admin sem flag vai para dashboard", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1", app_metadata: {} } },
        }),
      },
    });
    const req = new NextRequest("http://localhost/admin");
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("admin com is_admin segue", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1", app_metadata: { is_admin: true } } },
        }),
      },
    });
    const req = new NextRequest("http://localhost/admin");
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it("/admin com is_admin false redireciona para dashboard", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1", app_metadata: { is_admin: false } } },
        }),
      },
    });
    const req = new NextRequest("http://localhost/admin");
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("is_admin string não concede acesso admin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1", app_metadata: { is_admin: "true" as unknown as boolean } } },
        }),
      },
    });
    const req = new NextRequest("http://localhost/admin");
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("/admin com app_metadata null trata como não admin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1", app_metadata: null } },
        }),
      },
    });
    const req = new NextRequest("http://localhost/admin");
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("getUser em erro trata como não autenticado", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockRejectedValue(new Error("net")) },
    });
    const req = new NextRequest("http://localhost/dashboard");
    const res = await proxy(req);
    expect(res.headers.get("location")).toMatch(/login/);
  });

  it("propaga cookies via setAll do cliente Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockImplementation((_url: string, _key: string, opts: { cookies: { getAll: () => unknown[]; setAll: (c: { name: string; value: string; options?: object }[]) => void } }) => {
      opts.cookies.getAll();
      opts.cookies.setAll([
        { name: "sb", value: "1", options: { path: "/" } },
      ]);
      return {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      };
    });
    const req = new NextRequest("http://localhost/");
    await proxy(req);
    expect(createServerClient).toHaveBeenCalled();
  });

  it("rota /api deixa passar sem exigir sessão", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    });
    const req = new NextRequest("http://localhost/api/health");
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it("rota pública / retorna next para visitante", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    createServerClient.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const req = new NextRequest("http://localhost/");
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });
});
