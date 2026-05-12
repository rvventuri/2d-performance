import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { POST } from "../[token]/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_STUDENT_ROW = {
  name: "Carlos Silva",
  age: 24,
  weight: 78,
  height: 182,
  objective: "melhorar explosão",
  photo_url: null,
};

const MOCK_ASSESSMENT_ROW = {
  id: "a-1",
  student_id: "s-1",
  date: "2025-01-10",
  cmj: 42.5,
  sj: null,
  abalakov: null,
  rsi: null,
  tempo_contato: null,
  altura_salto_dj: null,
  cmj_esquerdo: null,
  cmj_direito: null,
  assimetria_percentual: null,
  salto_horizontal: null,
};

/**
 * Builds an admin mock where each `from(table)` call returns a fresh
 * query chain that resolves with the provided data.
 */
function makeAdminMock(tableMap: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => {
      const resolved = tableMap[table] ?? { data: null, error: null };
      const chain: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(resolved),
        // for list queries (no .single()), make the chain itself awaitable
        then: (resolve: (v: unknown) => void) =>
          Promise.resolve(resolved).then(resolve),
      };
      return chain;
    }),
  };
}

function makeRequest(token: string, body?: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/share/${token}`, {
    method: "POST",
    ...(body
      ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } }
      : {}),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/share/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 404 quando token não existe", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdminMock({
        share_links: { data: null, error: { message: "not found" } },
      }) as never
    );
    const req = makeRequest("invalid-token");
    const res = await POST(req, { params: Promise.resolve({ token: "invalid-token" }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("retorna 403 quando link requer senha e nenhuma é enviada", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdminMock({
        share_links: {
          data: { id: "l-1", student_id: "s-1", user_id: "u-1", password_hash: "hashed" },
          error: null,
        },
      }) as never
    );
    const req = makeRequest("tok-pw");
    const res = await POST(req, { params: Promise.resolve({ token: "tok-pw" }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.requiresPassword).toBe(true);
  });

  it("retorna 401 quando senha enviada é incorreta", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdminMock({
        share_links: {
          data: { id: "l-1", student_id: "s-1", user_id: "u-1", password_hash: "hashed" },
          error: null,
        },
      }) as never
    );
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const req = makeRequest("tok-pw", { password: "wrong" });
    const res = await POST(req, { params: Promise.resolve({ token: "tok-pw" }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/senha/i);
  });

  it("retorna 200 com dados quando senha correta", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    // Each table call needs its own mock — use a stateful factory
    let callCount = 0;
    const adminMock = {
      from: vi.fn((table: string) => {
        if (table === "share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "l-1", student_id: "s-1", user_id: "u-1", password_hash: "hashed" },
              error: null,
            }),
          };
        }
        if (table === "students") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: MOCK_STUDENT_ROW, error: null }),
          };
        }
        if (table === "assessments") {
          const assessmentsResult = { data: [MOCK_ASSESSMENT_ROW] };
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue(assessmentsResult),
            }),
          };
        }
        if (table === "custom_metric_values") {
          callCount++;
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === "ai_analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never);

    const req = makeRequest("tok-pw", { password: "certa" });
    const res = await POST(req, { params: Promise.resolve({ token: "tok-pw" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.student.name).toBe("Carlos Silva");
    expect(body.assessments).toHaveLength(1);
    expect(body.assessments[0].metrics.cmj).toBe(42.5);
    expect(body.aiAnalysis).toBeNull();
  });

  it("retorna 200 com dados para link público (sem senha)", async () => {
    const adminMock = {
      from: vi.fn((table: string) => {
        if (table === "share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "l-2", student_id: "s-1", user_id: "u-1", password_hash: null },
              error: null,
            }),
          };
        }
        if (table === "students") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: MOCK_STUDENT_ROW, error: null }),
          };
        }
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        if (table === "ai_analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never);

    const req = makeRequest("tok-pub");
    const res = await POST(req, { params: Promise.resolve({ token: "tok-pub" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.student.name).toBe("Carlos Silva");
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("faz parse do JSON da análise IA quando presente", async () => {
    const aiContent = JSON.stringify({ performanceScore: 82, profileType: "Atleta Elástico" });

    const adminMock = {
      from: vi.fn((table: string) => {
        if (table === "share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "l-3", student_id: "s-1", user_id: "u-1", password_hash: null },
              error: null,
            }),
          };
        }
        if (table === "students") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: MOCK_STUDENT_ROW, error: null }),
          };
        }
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        if (table === "ai_analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { content: aiContent } }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never);

    const req = makeRequest("tok-ai");
    const res = await POST(req, { params: Promise.resolve({ token: "tok-ai" }) });
    const body = await res.json();

    expect(body.aiAnalysis).not.toBeNull();
    expect(body.aiAnalysis.performanceScore).toBe(82);
  });

  it("retorna 404 quando atleta não existe", async () => {
    const adminMock = {
      from: vi.fn((table: string) => {
        if (table === "share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "l-404", student_id: "s-missing", user_id: "u-1", password_hash: null },
              error: null,
            }),
          };
        }
        if (table === "students") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never);

    const req = makeRequest("tok-no-student");
    const res = await POST(req, { params: Promise.resolve({ token: "tok-no-student" }) });
    expect(res.status).toBe(404);
  });

  it("403 com body JSON inválido quando link exige senha", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdminMock({
        share_links: {
          data: { id: "l-1", student_id: "s-1", user_id: "u-1", password_hash: "hashed" },
          error: null,
        },
      }) as never
    );
    const req = new NextRequest("http://localhost/api/share/tok-bad-json", {
      method: "POST",
      body: "{ not-json",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({ token: "tok-bad-json" }) });
    expect(res.status).toBe(403);
  });

  it("agrega custom_metric_values para múltiplas avaliações", async () => {
    const row2 = { ...MOCK_ASSESSMENT_ROW, id: "a-2", date: "2025-01-11" };
    const adminMock = {
      from: vi.fn((table: string) => {
        if (table === "share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "l-cv", student_id: "s-1", user_id: "u-1", password_hash: null },
              error: null,
            }),
          };
        }
        if (table === "students") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: MOCK_STUDENT_ROW, error: null }),
          };
        }
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [MOCK_ASSESSMENT_ROW, row2] }),
            }),
          };
        }
        if (table === "custom_metric_values") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                { assessment_id: "a-1", metric_key: "custom_a", value: 9 },
                { assessment_id: "a-1", metric_key: "custom_a2", value: 3 },
                { assessment_id: "a-2", metric_key: "custom_b", value: null },
              ],
            }),
          };
        }
        if (table === "ai_analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never);

    const req = makeRequest("tok-multi-cv");
    const res = await POST(req, { params: Promise.resolve({ token: "tok-multi-cv" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.assessments).toHaveLength(2);
    expect(body.assessments[0].customMetrics.custom_a).toBe(9);
    expect(body.assessments[0].customMetrics.custom_a2).toBe(3);
    expect(body.assessments[1].customMetrics.custom_b).toBeNull();
  });

  it("mapeia avaliação esparsa e defaults do atleta", async () => {
    const sparseAssessment = {
      id: "a-sparse",
      student_id: "s-1",
      date: "2025-02-01",
    };
    const adminMock = {
      from: vi.fn((table: string) => {
        if (table === "share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "l-sp", student_id: "s-1", user_id: "u-1", password_hash: null },
              error: null,
            }),
          };
        }
        if (table === "students") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                name: "X",
                age: null,
                weight: null,
                height: null,
                objective: null,
                photo_url: null,
              },
              error: null,
            }),
          };
        }
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [sparseAssessment] }),
            }),
          };
        }
        if (table === "custom_metric_values") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        if (table === "ai_analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { content: "not-json" } }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never);

    const req = makeRequest("tok-sparse");
    const res = await POST(req, { params: Promise.resolve({ token: "tok-sparse" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.student.age).toBe(0);
    expect(body.assessments).toHaveLength(1);
    expect(body.assessments[0].metrics.cmj).toBeNull();
    expect(body.aiAnalysis).toBeNull();
  });

  it("assessmentRows null usa lista vazia", async () => {
    const adminMock = {
      from: vi.fn((table: string) => {
        if (table === "share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "l-null-a", student_id: "s-1", user_id: "u-1", password_hash: null },
              error: null,
            }),
          };
        }
        if (table === "students") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: MOCK_STUDENT_ROW, error: null }),
          };
        }
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null }),
            }),
          };
        }
        if (table === "ai_analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never);

    const req = makeRequest("tok-null-assess");
    const res = await POST(req, { params: Promise.resolve({ token: "tok-null-assess" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.assessments).toEqual([]);
  });

  it("trata JSON inválido na análise IA silenciosamente (retorna null)", async () => {
    const adminMock = {
      from: vi.fn((table: string) => {
        if (table === "share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "l-4", student_id: "s-1", user_id: "u-1", password_hash: null },
              error: null,
            }),
          };
        }
        if (table === "students") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: MOCK_STUDENT_ROW, error: null }),
          };
        }
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        if (table === "ai_analyses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { content: "{ invalid json" } }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never);

    const req = makeRequest("tok-bad-ai");
    const res = await POST(req, { params: Promise.resolve({ token: "tok-bad-ai" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.aiAnalysis).toBeNull();
  });
});
