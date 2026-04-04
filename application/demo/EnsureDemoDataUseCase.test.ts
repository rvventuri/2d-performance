import { describe, it, expect, vi } from "vitest";
import { EnsureDemoDataUseCase } from "./EnsureDemoDataUseCase";
import type { IDemoTemplateRepository } from "@/domain/demo/repositories/IDemoTemplateRepository";

const targetId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const templateId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function makeRepo(overrides: Partial<IDemoTemplateRepository> = {}): IDemoTemplateRepository {
  return {
    hasDemoBeenApplied: vi.fn().mockResolvedValue(false),
    cloneTemplateToUser: vi.fn().mockResolvedValue(undefined),
    clearDemoStudents: vi.fn(),
    markDemoCleared: vi.fn(),
    ...overrides,
  };
}

describe("EnsureDemoDataUseCase", () => {
  it("ignora quando não há repositório (admin ausente)", async () => {
    const useCase = new EnsureDemoDataUseCase(null, templateId);
    const r = await useCase.execute(targetId);
    expect(r).toEqual({ cloned: false, skippedReason: "no_admin" });
  });

  it("ignora quando DEMO_TEMPLATE_USER_ID não está definido", async () => {
    const useCase = new EnsureDemoDataUseCase(makeRepo(), undefined);
    const r = await useCase.execute(targetId);
    expect(r).toEqual({ cloned: false, skippedReason: "no_template_user" });
  });

  it("ignora quando alvo é o próprio usuário template", async () => {
    const useCase = new EnsureDemoDataUseCase(makeRepo(), templateId);
    const r = await useCase.execute(templateId);
    expect(r).toEqual({ cloned: false, skippedReason: "same_as_template" });
  });

  it("não clona se demo já foi aplicada", async () => {
    const repo = makeRepo({ hasDemoBeenApplied: vi.fn().mockResolvedValue(true) });
    const useCase = new EnsureDemoDataUseCase(repo, templateId);
    const r = await useCase.execute(targetId);
    expect(r).toEqual({ cloned: false, skippedReason: "already_applied" });
    expect(repo.cloneTemplateToUser).not.toHaveBeenCalled();
  });

  it("clona na primeira vez", async () => {
    const repo = makeRepo();
    const useCase = new EnsureDemoDataUseCase(repo, templateId);
    const r = await useCase.execute(targetId);
    expect(r).toEqual({ cloned: true });
    expect(repo.cloneTemplateToUser).toHaveBeenCalledWith(targetId, templateId);
  });

  it("aceita template id com espaços (trim)", async () => {
    const repo = makeRepo();
    const useCase = new EnsureDemoDataUseCase(repo, `  ${templateId}  `);
    await useCase.execute(targetId);
    expect(repo.cloneTemplateToUser).toHaveBeenCalledWith(targetId, templateId);
  });
});
