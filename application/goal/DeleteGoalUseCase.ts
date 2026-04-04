import { IGoalRepository } from "@/domain/goal/repositories/IGoalRepository";

export class DeleteGoalUseCase {
  constructor(private readonly repo: IGoalRepository) {}

  async execute(studentId: string, metricKey: string): Promise<void> {
    return this.repo.delete(studentId, metricKey);
  }
}
