import { describe, it, expect, vi } from "vitest";
import { SupabaseMetricConfigRepository } from "./MetricConfigRepository";

const userId = "user-123";

const dbRow = {
  id: "mc-1",
  user_id: userId,
  metric_key: "cmj",
  label: "CMJ",
  unit: "cm",
  higher_is_better: true,
  is_custom: false,
  is_enabled: true,
  bench_recreational: 35,
  bench_trained: 50,
  bench_elite: 70,
  weight: "2.00",
  display_order: 0,
  created_at: "2025-01-01T00:00:00Z",
};

describe("SupabaseMetricConfigRepository.getByUserId", () => {
  it("retorna lista mapeada e ordenada", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [dbRow], error: null }),
          }),
        }),
      }),
    };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    const result = await repo.getByUserId(userId);
    expect(result).toHaveLength(1);
    expect(result[0].metricKey).toBe("cmj");
    expect(result[0].weight).toBe(2);
    expect(result[0].benchRecreational).toBe(35);
  });

  it("retorna lista vazia quando não há rows", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    const result = await repo.getByUserId(userId);
    expect(result).toEqual([]);
  });

  it("lança quando getByUserId retorna erro", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: "e" } }),
          }),
        }),
      }),
    };
    await expect(new SupabaseMetricConfigRepository(supabase, userId).getByUserId(userId)).rejects.toThrow("e");
  });

  it("mapeia higher_is_better e is_custom falsos", async () => {
    const row = {
      ...dbRow,
      higher_is_better: false,
      is_custom: true,
    };
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [row], error: null }),
          }),
        }),
      }),
    };
    const list = await new SupabaseMetricConfigRepository(supabase, userId).getByUserId(userId);
    expect(list[0].higherIsBetter).toBe(false);
    expect(list[0].isCustom).toBe(true);
  });

  it("mapeia unit e display_order nulos", async () => {
    const row = {
      ...dbRow,
      unit: null,
      display_order: null,
      bench_recreational: null,
      bench_trained: null,
      bench_elite: null,
    };
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [row], error: null }),
          }),
        }),
      }),
    };
    const list = await new SupabaseMetricConfigRepository(supabase, userId).getByUserId(userId);
    expect(list[0].unit).toBe("");
    expect(list[0].displayOrder).toBe(0);
    expect(list[0].benchRecreational).toBeNull();
  });
});

describe("SupabaseMetricConfigRepository.upsert", () => {
  it("chama upsert com onConflict user_id,metric_key", async () => {
    const single = vi.fn().mockResolvedValue({ data: dbRow, error: null });
    const upsertFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ upsert: upsertFn }) };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    await repo.upsert(userId, {
      metricKey: "cmj",
      label: "CMJ",
      unit: "cm",
      higherIsBetter: true,
      isCustom: false,
      isEnabled: true,
      benchRecreational: 35,
      benchTrained: 50,
      benchElite: 70,
      weight: 2,
      displayOrder: 0,
    });
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: userId, metric_key: "cmj" }),
      { onConflict: "user_id,metric_key" }
    );
  });

  it("upsert lança em erro", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "u" } });
    const upsertFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ upsert: upsertFn }) };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    await expect(
      repo.upsert(userId, {
        metricKey: "cmj",
        label: "CMJ",
        unit: "cm",
        higherIsBetter: true,
        isCustom: false,
        isEnabled: true,
        benchRecreational: null,
        benchTrained: null,
        benchElite: null,
        weight: 1,
        displayOrder: 0,
      })
    ).rejects.toThrow("u");
  });
});

describe("SupabaseMetricConfigRepository.delete", () => {
  it("deleta por user_id e metric_key", async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const deleteFn = vi.fn().mockReturnValue({ eq: eq1 });
    const supabase = { from: vi.fn().mockReturnValue({ delete: deleteFn }) };
    const repo = new SupabaseMetricConfigRepository(supabase, userId);
    await repo.delete(userId, "cmj");
    expect(eq1).toHaveBeenCalledWith("user_id", userId);
    expect(eq2).toHaveBeenCalledWith("metric_key", "cmj");
  });

  it("delete lança em erro", async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: { message: "del" } });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const deleteFn = vi.fn().mockReturnValue({ eq: eq1 });
    const supabase = { from: vi.fn().mockReturnValue({ delete: deleteFn }) };
    await expect(new SupabaseMetricConfigRepository(supabase, userId).delete(userId, "x")).rejects.toThrow("del");
  });
});
