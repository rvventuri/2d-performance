import { StudentGoal } from "@/lib/types";

export interface IGoalRepository {
  getByStudent(studentId: string): Promise<StudentGoal[]>;
  save(data: Omit<StudentGoal, "id" | "createdAt">): Promise<StudentGoal>;
  delete(studentId: string, metricKey: string): Promise<void>;
}
