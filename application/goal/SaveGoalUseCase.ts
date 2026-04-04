import { StudentGoal } from "@/lib/types";
import { IGoalRepository } from "@/domain/goal/repositories/IGoalRepository";

export interface SaveGoalInput {
  studentId: string;
  metricKey: string;
  targetValue: number;
  targetDate?: string | null;
}

export class SaveGoalUseCase {
  constructor(
    private readonly repo: IGoalRepository,
    private readonly userId: string,
  ) {}

  async execute(input: SaveGoalInput): Promise<StudentGoal> {
    return this.repo.save({
      studentId: input.studentId,
      userId: this.userId,
      metricKey: input.metricKey,
      targetValue: input.targetValue,
      targetDate: input.targetDate ?? null,
    });
  }
}
