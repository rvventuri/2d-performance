import { Assessment } from "@/lib/types";

export interface IAssessmentRepository {
  getByStudentId(studentId: string): Promise<Assessment[]>;
  create(data: Omit<Assessment, "id">): Promise<Assessment>;
  delete(id: string): Promise<void>;
}
