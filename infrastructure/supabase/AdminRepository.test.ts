import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseAdminRepository } from "./AdminRepository";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";

function makeAdmin(overrides: {
  students?: { user_id: string }[];
  assessments?: { user_id: string }[];
  analyses?: Record<string, unknown>[];
  users?: { id: string; email: string; created_at: string; user_metadata?: Record<string, unknown> }[];
} = {}) {
  const students = overrides.students ?? [{ user_id: "u1" }];
  const assessments = overrides.assessments ?? [{ user_id: "u1" }];
  const analyses = overrides.analyses ?? [
    { status: "done", duration_ms: 100, input_tokens: 10, output_tokens: 20 },
  ];
  const users = overrides.users ?? [
    {
      id: "u1",
      email: "a@b.com",
      created_at: new Date().toISOString(),
      user_metadata: { full_name: "Nome" },
    },
  ];

  return {
    from: vi.fn((table: string) => {
      if (table === "students") {
        return {
          select: vi.fn().mockResolvedValue({ data: students, error: null }),
        };
      }
      if (table === "assessments") {
        return {
          select: vi.fn().mockResolvedValue({ data: assessments, error: null }),
        };
      }
      if (table === "ai_analyses") {
        return {
          select: vi.fn().mockResolvedValue({ data: analyses, error: null }),
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users }, error: null }),
      },
    },
  };
}

describe("SupabaseAdminRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getMetrics agrega contagens e top trainers", async () => {
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin() as never);
    const repo = new SupabaseAdminRepository();
    const m = await repo.getMetrics();
    expect(m.totalTrainers).toBe(1);
    expect(m.totalStudents).toBe(1);
    expect(m.totalAssessments).toBe(1);
    expect(m.aiAnalysesByStatus.done).toBe(1);
    expect(m.aiUsageStats.avgDurationMs).toBe(100);
    expect(m.topTrainers[0].userId).toBe("u1");
    expect(m.signupsPerMonth).toHaveLength(6);
  });

  it("avgDurationMs null quando nenhuma análise done com duration", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        analyses: [{ status: "pending", duration_ms: null, input_tokens: null, output_tokens: null }],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.aiUsageStats.avgDurationMs).toBeNull();
  });

  it("conta status desconhecidos apenas se no mapa", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        analyses: [{ status: "weird", duration_ms: null, input_tokens: 0, output_tokens: 0 }],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.aiAnalysesByStatus.done).toBe(0);
  });

  it("topTrainers usa email quando sem full_name", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        users: [{ id: "u2", email: "only@email.com", created_at: new Date().toISOString(), user_metadata: {} }],
        students: [],
        assessments: [],
        analyses: [],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.topTrainers[0].name).toBe("only@email.com");
  });

  it("topTrainers usa id quando email vazio e sem full_name", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        users: [{ id: "u-idonly", email: "", created_at: new Date().toISOString(), user_metadata: {} }],
        students: [],
        assessments: [],
        analyses: [],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.topTrainers[0].name).toBe("u-idonly");
  });

  it("conta análises por status pending running error", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        analyses: [
          { status: "pending", duration_ms: null, input_tokens: 0, output_tokens: 0 },
          { status: "running", duration_ms: null, input_tokens: 0, output_tokens: 0 },
          { status: "error", duration_ms: null, input_tokens: 0, output_tokens: 0 },
        ],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.aiAnalysesByStatus.pending).toBe(1);
    expect(m.aiAnalysesByStatus.running).toBe(1);
    expect(m.aiAnalysesByStatus.error).toBe(1);
  });

  it("ignora análises done sem duration no cálculo de média", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        analyses: [
          { status: "done", duration_ms: null, input_tokens: 5, output_tokens: 5 },
          { status: "done", duration_ms: 200, input_tokens: 0, output_tokens: 0 },
        ],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.aiUsageStats.avgDurationMs).toBe(200);
  });

  it("agrega múltiplos students por user_id", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        students: [{ user_id: "u1" }, { user_id: "u1" }, { user_id: "u2" }],
        users: [
          { id: "u1", email: "a@a.com", created_at: new Date().toISOString(), user_metadata: {} },
          { id: "u2", email: "b@b.com", created_at: new Date().toISOString(), user_metadata: {} },
        ],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    const u1 = m.topTrainers.find((t) => t.userId === "u1");
    expect(u1?.studentCount).toBe(2);
  });

  it("newTrainersLast30Days considera apenas contas recentes", async () => {
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        users: [
          { id: "u-old", email: "old@a.com", created_at: old, user_metadata: {} },
          { id: "u-new", email: "new@a.com", created_at: recent, user_metadata: {} },
        ],
        students: [],
        assessments: [],
        analyses: [],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.totalTrainers).toBe(2);
    expect(m.newTrainersLast30Days).toBe(1);
  });

  it("soma tokens quando input/output ausentes", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        analyses: [
          { status: "done", duration_ms: 10, input_tokens: undefined, output_tokens: undefined },
          { status: "done", duration_ms: 20, input_tokens: 3, output_tokens: 4 },
        ],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.aiUsageStats.totalInputTokens).toBe(3);
    expect(m.aiUsageStats.totalOutputTokens).toBe(4);
    expect(m.aiUsageStats.avgDurationMs).toBe(15);
  });

  it("signupsPerMonth distribui usuários por mês", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
    const users = Array.from({ length: 6 }, (_, i) => ({
      id: `um-${i}`,
      email: `m${i}@a.com`,
      created_at: new Date(2026, 5 - i, 3).toISOString(),
      user_metadata: {} as Record<string, unknown>,
    }));
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({ users, students: [], assessments: [], analyses: [] }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.signupsPerMonth).toHaveLength(6);
    expect(m.signupsPerMonth.reduce((s, x) => s + x.count, 0)).toBeGreaterThanOrEqual(6);
    vi.useRealTimers();
  });

  it("topTrainers ordena por studentCount", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        users: [
          { id: "low", email: "l@a.com", created_at: new Date().toISOString(), user_metadata: {} },
          { id: "high", email: "h@a.com", created_at: new Date().toISOString(), user_metadata: {} },
        ],
        students: [{ user_id: "high" }, { user_id: "high" }, { user_id: "low" }],
        assessments: [],
        analyses: [],
      }) as never
    );
    const m = await new SupabaseAdminRepository().getMetrics();
    expect(m.topTrainers[0].userId).toBe("high");
    expect(m.topTrainers[1].userId).toBe("low");
  });
});
