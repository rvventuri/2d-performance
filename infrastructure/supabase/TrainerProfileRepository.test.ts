import { describe, it, expect, vi } from "vitest";
import { SupabaseTrainerProfileRepository } from "./TrainerProfileRepository";

const userId = "user-123";

describe("SupabaseTrainerProfileRepository.getByUserId", () => {
  it("retorna null quando não existe row (PGRST116)", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
      }),
    };
    const repo = new SupabaseTrainerProfileRepository(supabase, userId);
    const result = await repo.getByUserId(userId);
    expect(result).toBeNull();
  });

  it("retorna TrainerProfile mapeado corretamente", async () => {
    const row = {
      id: "id-1",
      user_id: userId,
      coaching_philosophy: "Periodização ondulatória",
      sport_context: "Futebol",
      athlete_profiles: "Atletas amadadores",
      priority_focus: "RSI",
      custom_instructions: "Usar benchmarks de futvolei",
      updated_at: "2025-01-01T00:00:00Z",
    };
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: row, error: null }),
          }),
        }),
      }),
    };
    const repo = new SupabaseTrainerProfileRepository(supabase, userId);
    const result = await repo.getByUserId(userId);
    expect(result).not.toBeNull();
    expect(result!.coachingPhilosophy).toBe("Periodização ondulatória");
    expect(result!.sportContext).toBe("Futebol");
    expect(result!.userId).toBe(userId);
  });

  it("mapeia campos nulos do banco para string vazia", async () => {
    const row = {
      id: "id-1",
      user_id: userId,
      coaching_philosophy: null,
      sport_context: null,
      athlete_profiles: null,
      priority_focus: null,
      custom_instructions: null,
      updated_at: "2025-01-01T00:00:00Z",
    };
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: row, error: null }),
          }),
        }),
      }),
    };
    const result = await new SupabaseTrainerProfileRepository(supabase, userId).getByUserId(userId);
    expect(result!.coachingPhilosophy).toBe("");
    expect(result!.sportContext).toBe("");
  });

  it("lança erro para outros erros do Supabase", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "500", message: "DB error" } }),
          }),
        }),
      }),
    };
    const repo = new SupabaseTrainerProfileRepository(supabase, userId);
    await expect(repo.getByUserId(userId)).rejects.toThrow("DB error");
  });
});

describe("SupabaseTrainerProfileRepository.upsert", () => {
  it("chama upsert com snake_case correto", async () => {
    const savedRow = {
      id: "new-id",
      user_id: userId,
      coaching_philosophy: "A",
      sport_context: "B",
      athlete_profiles: "C",
      priority_focus: "D",
      custom_instructions: "E",
      updated_at: "2025-01-01T00:00:00Z",
    };
    const single = vi.fn().mockResolvedValue({ data: savedRow, error: null });
    const upsertSelectSingle = { select: vi.fn().mockReturnValue({ single }) };
    const upsertFn = vi.fn().mockReturnValue(upsertSelectSingle);
    const supabase = {
      from: vi.fn().mockReturnValue({ upsert: upsertFn }),
    };
    const repo = new SupabaseTrainerProfileRepository(supabase, userId);
    const result = await repo.upsert(userId, {
      coachingPhilosophy: "A",
      sportContext: "B",
      athleteProfiles: "C",
      priorityFocus: "D",
      customInstructions: "E",
    });
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        coaching_philosophy: "A",
        sport_context: "B",
      }),
      { onConflict: "user_id" }
    );
    expect(result.coachingPhilosophy).toBe("A");
  });

  it("upsert converte strings vazias em null", async () => {
    const savedRow = {
      id: "new-id",
      user_id: userId,
      coaching_philosophy: null,
      sport_context: null,
      athlete_profiles: null,
      priority_focus: null,
      custom_instructions: null,
      updated_at: "2025-01-01T00:00:00Z",
    };
    const single = vi.fn().mockResolvedValue({ data: savedRow, error: null });
    const upsertFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ upsert: upsertFn }) };
    await new SupabaseTrainerProfileRepository(supabase, userId).upsert(userId, {
      coachingPhilosophy: "",
      sportContext: "",
      athleteProfiles: "",
      priorityFocus: "",
      customInstructions: "",
    });
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        coaching_philosophy: null,
        sport_context: null,
      }),
      { onConflict: "user_id" }
    );
  });

  it("upsert lança em erro", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "bad" } });
    const upsertFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ upsert: upsertFn }) };
    await expect(
      new SupabaseTrainerProfileRepository(supabase, userId).upsert(userId, {
        coachingPhilosophy: "a",
        sportContext: "b",
        athleteProfiles: "c",
        priorityFocus: "d",
        customInstructions: "e",
      })
    ).rejects.toThrow("bad");
  });
});
