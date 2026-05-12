import { describe, it, expect, vi } from "vitest";
import { SupabaseCustomMetricValueRepository } from "./CustomMetricValueRepository";

describe("SupabaseCustomMetricValueRepository", () => {
  it("getByAssessmentIds retorna {} quando ids vazio", async () => {
    const supabase = { from: vi.fn() };
    const repo = new SupabaseCustomMetricValueRepository(supabase, "u");
    expect(await repo.getByAssessmentIds([])).toEqual({});
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("getByAssessmentIds agrega por assessment", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              { assessment_id: "a1", metric_key: "m1", value: 2 },
              { assessment_id: "a1", metric_key: "m2", value: null },
            ],
            error: null,
          }),
        }),
      }),
    };
    const repo = new SupabaseCustomMetricValueRepository(supabase, "u");
    const out = await repo.getByAssessmentIds(["a1"]);
    expect(out.a1.m1).toBe(2);
    expect(out.a1.m2).toBeNull();
  });

  it("getByAssessmentIds lança em erro", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: null, error: { message: "x" } }),
        }),
      }),
    };
    await expect(
      new SupabaseCustomMetricValueRepository(supabase, "u").getByAssessmentIds(["a"])
    ).rejects.toThrow("x");
  });

  it("saveValues não chama upsert quando vazio", async () => {
    const upsert = vi.fn();
    const supabase = { from: vi.fn().mockReturnValue({ upsert }) };
    await new SupabaseCustomMetricValueRepository(supabase, "u").saveValues("a", {});
    expect(upsert).not.toHaveBeenCalled();
  });

  it("saveValues faz upsert", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ upsert }) };
    await new SupabaseCustomMetricValueRepository(supabase, "u").saveValues("a", { k: 1 });
    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ assessment_id: "a", user_id: "u", metric_key: "k", value: 1 }),
      ]),
      { onConflict: "assessment_id,metric_key" }
    );
  });

  it("saveValues lança em erro", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "up-fail" } });
    const supabase = { from: vi.fn().mockReturnValue({ upsert }) };
    await expect(
      new SupabaseCustomMetricValueRepository(supabase, "u").saveValues("a", { k: 1 })
    ).rejects.toThrow("up-fail");
  });
});
