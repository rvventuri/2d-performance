import { Assessment } from "@/lib/types";
import { IAssessmentRepository } from "@/domain/assessment/repositories/IAssessmentRepository";

export class GetAssessmentsUseCase {
  constructor(private readonly assessmentRepo: IAssessmentRepository) {}

  async execute(studentId: string): Promise<Assessment[]> {
    return this.assessmentRepo.getByStudentId(studentId);
  }
}
