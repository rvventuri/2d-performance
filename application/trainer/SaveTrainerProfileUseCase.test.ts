import { describe, it, expect, vi } from "vitest";
import { SaveTrainerProfileUseCase } from "./SaveTrainerProfileUseCase";
import { TrainerProfile } from "@/lib/types";

const userId = "user-1";

function makeProfileRepo(saved: Partial<TrainerProfile> = {}) {
  return {
    getByUserId: vi.fn(),
    upsert: vi.fn().mockResolvedValue({ id: "new-id", userId, updatedAt: "2025-01-01", ...saved }),
  };
}

describe("SaveTrainerProfileUseCase", () => {
  it("chama upsert com os dados corretos", async () => {
    const repo = makeProfileRepo();
    const useCase = new SaveTrainerProfileUseCase(repo);
    const data = {
      coachingPhilosophy: "Periodização ondulatória",
      sportContext: "Futebol",
      athleteProfiles: "Atletas amadadores",
      priorityFocus: "RSI",
      customInstructions: "Incluir comparativo futvolei",
    };
    await useCase.execute(userId, data);
    expect(repo.upsert).toHaveBeenCalledWith(userId, data);
  });

  it("retorna o TrainerProfile salvo", async () => {
    const repo = makeProfileRepo({ coachingPhilosophy: "A" });
    const useCase = new SaveTrainerProfileUseCase(repo);
    const result = await useCase.execute(userId, {
      coachingPhilosophy: "A",
      sportContext: "",
      athleteProfiles: "",
      priorityFocus: "",
      customInstructions: "",
    });
    expect(result.coachingPhilosophy).toBe("A");
  });

  it("propaga erros do repositório", async () => {
    const repo = {
      getByUserId: vi.fn(),
      upsert: vi.fn().mockRejectedValue(new Error("DB error")),
    };
    const useCase = new SaveTrainerProfileUseCase(repo);
    await expect(
      useCase.execute(userId, {
        coachingPhilosophy: "",
        sportContext: "",
        athleteProfiles: "",
        priorityFocus: "",
        customInstructions: "",
      })
    ).rejects.toThrow("DB error");
  });
});
