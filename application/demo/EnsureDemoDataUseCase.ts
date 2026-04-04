import type { IDemoTemplateRepository } from "@/domain/demo/repositories/IDemoTemplateRepository";

export type EnsureDemoDataResult = {
  cloned: boolean;
  skippedReason?: "no_admin" | "no_template_user" | "same_as_template" | "already_applied";
};

/**
 * Na primeira visita ao app, copia alunos/avaliações/análises de IA do usuário template.
 */
export class EnsureDemoDataUseCase {
  constructor(
    private readonly repo: IDemoTemplateRepository | null,
    private readonly templateUserId: string | undefined
  ) {}

  async execute(targetUserId: string): Promise<EnsureDemoDataResult> {
    const templateId = this.templateUserId?.trim();
    if (!this.repo) {
      return { cloned: false, skippedReason: "no_admin" };
    }
    if (!templateId) {
      return { cloned: false, skippedReason: "no_template_user" };
    }
    if (targetUserId === templateId) {
      return { cloned: false, skippedReason: "same_as_template" };
    }

    const already = await this.repo.hasDemoBeenApplied(targetUserId);
    if (already) {
      return { cloned: false, skippedReason: "already_applied" };
    }

    await this.repo.cloneTemplateToUser(targetUserId, templateId);
    return { cloned: true };
  }
}
