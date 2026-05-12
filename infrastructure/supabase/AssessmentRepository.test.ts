import { describe, it, expect, vi } from "vitest";
import { SupabaseAssessmentRepository } from "./AssessmentRepository";

const userId = "u-1";

const assessmentRow = {
  id: "a-1",
  student_id: "s-1",
  user_id: userId,
  date: "2025-01-01",
  cmj: 40,
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

describe("SupabaseAssessmentRepository", () => {
  it("getByStudentId retorna lista vazia sem custom query", async () => {
    const innerOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const outerOrder = vi.fn().mockReturnValue({ order: innerOrder });
    const eqUser = vi.fn().mockReturnValue({ order: outerOrder });
    const eqStudent = vi.fn().mockReturnValue({ eq: eqUser });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqStudent,
        }),
      }),
    };
    const repo = new SupabaseAssessmentRepository(supabase, userId);
    expect(await repo.getByStudentId("s-1")).toEqual([]);
  });

  it("getByStudentId carrega custom metrics", async () => {
    const innerOrder = vi.fn().mockResolvedValue({ data: [assessmentRow], error: null });
    const outerOrder = vi.fn().mockReturnValue({ order: innerOrder });
    const eqUser = vi.fn().mockReturnValue({ order: outerOrder });
    const eqStudent = vi.fn().mockReturnValue({ eq: eqUser });
    const inFn = vi.fn().mockResolvedValue({
      data: [{ assessment_id: "a-1", metric_key: "x", value: 1 }],
      error: null,
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: eqStudent,
            }),
          };
        }
        if (table === "custom_metric_values") {
          return {
            select: vi.fn().mockReturnValue({
              in: inFn,
            }),
          };
        }
        return {};
      }),
    };
    const repo = new SupabaseAssessmentRepository(supabase, userId);
    const list = await repo.getByStudentId("s-1");
    expect(list).toHaveLength(1);
    expect(list[0].customMetrics?.x).toBe(1);
  });

  it("getByStudentId com duas avaliações mescla custom metrics por id", async () => {
    const rowB = { ...assessmentRow, id: "a-2", date: "2025-01-02" };
    const innerOrder = vi.fn().mockResolvedValue({ data: [assessmentRow, rowB], error: null });
    const outerOrder = vi.fn().mockReturnValue({ order: innerOrder });
    const eqUser = vi.fn().mockReturnValue({ order: outerOrder });
    const eqStudent = vi.fn().mockReturnValue({ eq: eqUser });
    const inFn = vi.fn().mockResolvedValue({
      data: [
        { assessment_id: "a-1", metric_key: "m1", value: 1 },
        { assessment_id: "a-1", metric_key: "m2", value: 2 },
        { assessment_id: "a-2", metric_key: "m3", value: 3 },
      ],
      error: null,
    });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: eqStudent,
            }),
          };
        }
        if (table === "custom_metric_values") {
          return {
            select: vi.fn().mockReturnValue({
              in: inFn,
            }),
          };
        }
        return {};
      }),
    };
    const list = await new SupabaseAssessmentRepository(supabase, userId).getByStudentId("s-1");
    expect(list).toHaveLength(2);
    expect(list[0].customMetrics?.m1).toBe(1);
    expect(list[0].customMetrics?.m2).toBe(2);
    expect(list[1].customMetrics?.m3).toBe(3);
  });

  it("getByStudentId lança em erro", async () => {
    const innerOrder = vi.fn().mockResolvedValue({ data: null, error: { message: "bad" } });
    const outerOrder = vi.fn().mockReturnValue({ order: innerOrder });
    const eqUser = vi.fn().mockReturnValue({ order: outerOrder });
    const eqStudent = vi.fn().mockReturnValue({ eq: eqUser });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqStudent,
        }),
      }),
    };
    await expect(new SupabaseAssessmentRepository(supabase, userId).getByStudentId("s")).rejects.toThrow("bad");
  });

  it("create insere e mapeia", async () => {
    const single = vi.fn().mockResolvedValue({ data: assessmentRow, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single }),
        }),
      }),
    };
    const repo = new SupabaseAssessmentRepository(supabase, userId);
    const a = await repo.create({
      studentId: "s-1",
      date: "2025-01-01",
      metrics: {
        cmj: 40,
        sj: null,
        abalakov: null,
        rsi: null,
        tempoContato: null,
        alturaSaltoDJ: null,
        cmjEsquerdo: null,
        cmjDireito: null,
        assimetriaPercentual: null,
        saltoHorizontal: null,
      },
    });
    expect(a.id).toBe("a-1");
  });

  it("create lança em erro", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "ins" } });
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single }),
        }),
      }),
    };
    await expect(
      new SupabaseAssessmentRepository(supabase, userId).create({
        studentId: "s-1",
        date: "2025-01-01",
        metrics: {
          cmj: 40,
          sj: null,
          abalakov: null,
          rsi: null,
          tempoContato: null,
          alturaSaltoDJ: null,
          cmjEsquerdo: null,
          cmjDireito: null,
          assimetriaPercentual: null,
          saltoHorizontal: null,
        },
      })
    ).rejects.toThrow("ins");
  });

  it("delete encadeia eq", async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const del = vi.fn().mockReturnValue({ eq: eq1 });
    const supabase = { from: vi.fn().mockReturnValue({ delete: del }) };
    await new SupabaseAssessmentRepository(supabase, userId).delete("a-1");
    expect(del).toHaveBeenCalled();
  });

  it("delete lança em erro", async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: { message: "fail" } });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const del = vi.fn().mockReturnValue({ eq: eq1 });
    const supabase = { from: vi.fn().mockReturnValue({ delete: del }) };
    await expect(new SupabaseAssessmentRepository(supabase, userId).delete("a-1")).rejects.toThrow("fail");
  });
});
