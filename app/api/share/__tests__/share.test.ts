import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn(),
  },
}));

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { POST, GET, DELETE } from "../route";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_USER = { id: "user-1" };

/** Fluent Supabase query builder mock */
function makeQueryMock(resolveWith: unknown) {
  const self: Record<string, unknown> = {};
  const methods = ["select", "insert", "delete", "update", "eq", "single", "order", "limit", "in"];
  for (const m of methods) {
    self[m] = vi.fn(() => self);
  }
  (self as { then: unknown }).then = undefined;
  Object.assign(self, { data: null, error: null });

  // Make it thenable so `await chain` works
  self["single"] = vi.fn().mockResolvedValue(resolveWith);
  self["eq"] = vi.fn(() => self);
  self["select"] = vi.fn(() => self);
  self["insert"] = vi.fn(() => self);
  self["delete"] = vi.fn(() => self);
  return self;
}

function makeServerSupabase({
  user = MOCK_USER,
  studentData = { id: "student-1" },
  studentError = null,
  linkData = null as unknown,
} = {}) {
  const studentQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: studentData, error: studentError }),
  };
  const linkQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: linkData }),
    delete: vi.fn().mockReturnThis(),
  };
  const deleteQuery = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  const mock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "students") return studentQuery;
      if (table === "share_links") return linkQuery;
      return deleteQuery;
    }),
  };
  return mock;
}

function makeAdminSupabase({
  insertData = { token: "tok123", created_at: "2025-01-01T00:00:00Z" } as unknown,
  insertError = null,
} = {}) {
  const insertQuery = {
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: insertData, error: insertError }),
  };
  return { from: vi.fn().mockReturnValue(insertQuery) };
}

function makeRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>
) {
  return new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } } : {}),
  });
}

// ── POST /api/share ───────────────────────────────────────────────────────────

describe("POST /api/share", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 quando usuário não autenticado", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerSupabase({ user: null as unknown }) as never
    );
    const req = makeRequest("POST", "http://localhost/api/share", { studentId: "s-1" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 quando studentId ausente", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerSupabase() as never
    );
    const req = makeRequest("POST", "http://localhost/api/share", {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 404 quando atleta não pertence ao treinador", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerSupabase({ studentData: null, studentError: { message: "not found" } }) as never
    );
    const req = makeRequest("POST", "http://localhost/api/share", { studentId: "s-999" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("cria link público sem hash de senha", async () => {
    vi.mocked(createServerClient).mockResolvedValue(makeServerSupabase() as never);
    vi.mocked(createAdminClient).mockReturnValue(makeAdminSupabase() as never);

    const req = makeRequest("POST", "http://localhost/api/share", { studentId: "student-1" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.token).toBe("tok123");
    expect(body.hasPassword).toBe(false);
    expect(body.url).toContain("/share/tok123");
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it("cria link com senha e faz hash com bcrypt", async () => {
    vi.mocked(createServerClient).mockResolvedValue(makeServerSupabase() as never);
    vi.mocked(createAdminClient).mockReturnValue(makeAdminSupabase() as never);

    const req = makeRequest("POST", "http://localhost/api/share", {
      studentId: "student-1",
      password: "secreta123",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(bcrypt.hash).toHaveBeenCalledWith("secreta123", 10);
    expect(body.hasPassword).toBe(true);
  });

  it("retorna 500 quando insert falha", async () => {
    vi.mocked(createServerClient).mockResolvedValue(makeServerSupabase() as never);
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdminSupabase({ insertData: null, insertError: { message: "db error" } }) as never
    );
    const req = makeRequest("POST", "http://localhost/api/share", { studentId: "student-1" });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

// ── GET /api/share ────────────────────────────────────────────────────────────

describe("GET /api/share", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerSupabase({ user: null as unknown }) as never
    );
    const req = makeRequest("GET", "http://localhost/api/share?studentId=s-1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 quando studentId ausente", async () => {
    vi.mocked(createServerClient).mockResolvedValue(makeServerSupabase() as never);
    const req = makeRequest("GET", "http://localhost/api/share");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("retorna null quando link não existe", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerSupabase({ linkData: null }) as never
    );
    const req = makeRequest("GET", "http://localhost/api/share?studentId=student-1");
    const res = await GET(req);
    const body = await res.json();
    expect(body).toBeNull();
  });

  it("retorna metadados com hasPassword=false para link público", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerSupabase({
        linkData: { token: "tok-pub", password_hash: null, created_at: "2025-01-01T00:00:00Z" },
      }) as never
    );
    const req = makeRequest("GET", "http://localhost/api/share?studentId=student-1");
    const res = await GET(req);
    const body = await res.json();
    expect(body.hasPassword).toBe(false);
    expect(body.token).toBe("tok-pub");
    expect(body.url).toContain("/share/tok-pub");
  });

  it("retorna hasPassword=true para link com senha", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerSupabase({
        linkData: { token: "tok-pw", password_hash: "hashed", created_at: "2025-01-01T00:00:00Z" },
      }) as never
    );
    const req = makeRequest("GET", "http://localhost/api/share?studentId=student-1");
    const res = await GET(req);
    const body = await res.json();
    expect(body.hasPassword).toBe(true);
  });
});

// ── DELETE /api/share ─────────────────────────────────────────────────────────

describe("DELETE /api/share", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerSupabase({ user: null as unknown }) as never
    );
    const req = makeRequest("DELETE", "http://localhost/api/share?studentId=s-1");
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 quando studentId ausente", async () => {
    vi.mocked(createServerClient).mockResolvedValue(makeServerSupabase() as never);
    const req = makeRequest("DELETE", "http://localhost/api/share");
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("retorna 204 ao revogar com sucesso", async () => {
    vi.mocked(createServerClient).mockResolvedValue(makeServerSupabase() as never);
    const req = makeRequest("DELETE", "http://localhost/api/share?studentId=student-1");
    const res = await DELETE(req);
    expect(res.status).toBe(204);
  });
});
