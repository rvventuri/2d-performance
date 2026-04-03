import { Student } from "@/lib/types";

export interface IStudentRepository {
  getAll(): Promise<Student[]>;
  getById(id: string): Promise<Student | null>;
  create(data: Omit<Student, "id" | "createdAt">): Promise<Student>;
  update(id: string, data: Partial<Omit<Student, "id" | "createdAt">>): Promise<Student | null>;
  delete(id: string): Promise<void>;
}
