import type { IDemoTemplateRepository } from "@/domain/demo/repositories/IDemoTemplateRepository";

export type ClearDemoDataResult = { deletedStudents: number };

/**
 * Remove alunos marcados como demo e registra cleared_at em user_demo_state.
 */
export class ClearDemoDataUseCase {
  constructor(private readonly repo: IDemoTemplateRepository | null) {}

  async execute(userId: string): Promise<ClearDemoDataResult> {
    if (!this.repo) {
      throw new Error("Operação indisponível: cliente admin não configurado.");
    }
    const deletedStudents = await this.repo.clearDemoStudents(userId);
    await this.repo.markDemoCleared(userId);
    return { deletedStudents };
  }
}
