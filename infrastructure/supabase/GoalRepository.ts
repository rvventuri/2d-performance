import { StudentGoal } from "@/lib/types";
import { StudentGoalRow } from "@/lib/supabase/database.types";
import { IGoalRepository } from "@/domain/goal/repositories/IGoalRepository";

function rowToGoal(row: StudentGoalRow): StudentGoal {
  return {
    id: row.id,
    studentId: row.student_id,
    userId: row.user_id,
    metricKey: row.metric_key,
    targetValue: Number(row.target_value),
    targetDate: row.target_date ?? null,
    createdAt: row.created_at,
  };
}

export class SupabaseGoalRepository implements IGoalRepository {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly supabase: any,
    private readonly userId: string,
  ) {}

  async getByStudent(studentId: string): Promise<StudentGoal[]> {
    const { data, error } = await this.supabase
      .from("student_goals")
      .select("*")
      .eq("student_id", studentId)
      .eq("user_id", this.userId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToGoal);
  }

  async save(
    data: Omit<StudentGoal, "id" | "createdAt">,
  ): Promise<StudentGoal> {
    const { data: row, error } = await this.supabase
      .from("student_goals")
      .upsert(
        {
          student_id: data.studentId,
          user_id: this.userId,
          metric_key: data.metricKey,
          target_value: data.targetValue,
          target_date: data.targetDate ?? null,
        },
        { onConflict: "student_id,metric_key" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToGoal(row as StudentGoalRow);
  }

  async delete(studentId: string, metricKey: string): Promise<void> {
    const { error } = await this.supabase
      .from("student_goals")
      .delete()
      .eq("student_id", studentId)
      .eq("metric_key", metricKey)
      .eq("user_id", this.userId);

    if (error) throw new Error(error.message);
  }
}
