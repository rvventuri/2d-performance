import { Student } from "@/lib/types";
import { IStudentRepository } from "@/domain/student/repositories/IStudentRepository";

export class GetStudentUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(id: string): Promise<Student | null> {
    return this.studentRepo.getById(id);
  }
}
