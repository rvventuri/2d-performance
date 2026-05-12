import { describe, it, expect, vi } from "vitest";
import { SupabaseGoalRepository } from "./GoalRepository";

const userId = "u-1";

const goalRow = {
  id: "g-1",
  student_id: "s-1",
  user_id: userId,
  metric_key: "cmj",
  target_value: "50",
  target_date: "2026-01-01",
  created_at: "2025-01-01T00:00:00Z",
};

describe("SupabaseGoalRepository", () => {
  it("getByStudent mapeia lista", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [goalRow], error: null }),
            }),
          }),
        }),
      }),
    };
    const repo = new SupabaseGoalRepository(supabase, userId);
    const list = await repo.getByStudent("s-1");
    expect(list).toHaveLength(1);
    expect(list[0].targetValue).toBe(50);
  });

  it("getByStudent mapeia targetDate null", async () => {
    const row = { ...goalRow, target_date: null };
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [row], error: null }),
            }),
          }),
        }),
      }),
    };
    const list = await new SupabaseGoalRepository(supabase, userId).getByStudent("s-1");
    expect(list[0].targetDate).toBeNull();
  });

  it("getByStudent retorna [] quando data null", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    };
    expect(await new SupabaseGoalRepository(supabase, userId).getByStudent("s-1")).toEqual([]);
  });

  it("getByStudent trata data undefined como lista vazia", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: undefined, error: null }),
            }),
          }),
        }),
      }),
    };
    expect(await new SupabaseGoalRepository(supabase, userId).getByStudent("s-1")).toEqual([]);
  });

  it("getByStudent lança em erro", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: { message: "e" } }),
            }),
          }),
        }),
      }),
    };
    await expect(new SupabaseGoalRepository(supabase, userId).getByStudent("s")).rejects.toThrow("e");
  });

  it("save faz upsert e mapeia", async () => {
    const single = vi.fn().mockResolvedValue({ data: goalRow, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single }),
        }),
      }),
    };
    const repo = new SupabaseGoalRepository(supabase, userId);
    const g = await repo.save({
      studentId: "s-1",
      userId,
      metricKey: "cmj",
      targetValue: 50,
      targetDate: null,
    });
    expect(g.metricKey).toBe("cmj");
  });

  it("save lança em erro", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "upsert-fail" } });
    const supabase = {
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single }),
        }),
      }),
    };
    const repo = new SupabaseGoalRepository(supabase, userId);
    await expect(
      repo.save({ studentId: "s-1", userId, metricKey: "cmj", targetValue: 1, targetDate: null })
    ).rejects.toThrow("upsert-fail");
  });

  it("delete encadeia eq", async () => {
    const eq3 = vi.fn().mockResolvedValue({ error: null });
    const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const del = vi.fn().mockReturnValue({ eq: eq1 });
    const supabase = { from: vi.fn().mockReturnValue({ delete: del }) };
    await new SupabaseGoalRepository(supabase, userId).delete("s-1", "cmj");
    expect(eq3).toHaveBeenCalledWith("user_id", userId);
  });
});
