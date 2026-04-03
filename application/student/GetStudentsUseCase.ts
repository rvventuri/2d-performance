import { Student } from "@/lib/types";
import { IStudentRepository } from "@/domain/student/repositories/IStudentRepository";

export class GetStudentsUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(): Promise<Student[]> {
    return this.studentRepo.getAll();
  }
}
