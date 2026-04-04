import { StudentGoal } from "@/lib/types";
import { IGoalRepository } from "@/domain/goal/repositories/IGoalRepository";

export class GetGoalsUseCase {
  constructor(private readonly repo: IGoalRepository) {}

  async execute(studentId: string): Promise<StudentGoal[]> {
    return this.repo.getByStudent(studentId);
  }
}
