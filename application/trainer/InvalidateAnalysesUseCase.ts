export interface IAiAnalysisRepository {
  deleteAllForUser(userId: string): Promise<void>;
}

export class InvalidateAnalysesUseCase {
  constructor(private readonly analysisRepo: IAiAnalysisRepository) {}

  async execute(userId: string): Promise<void> {
    await this.analysisRepo.deleteAllForUser(userId);
  }
}
