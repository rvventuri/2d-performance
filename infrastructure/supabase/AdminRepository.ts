import { createAdminClient } from "@/lib/supabase/admin";
import type { IAdminRepository } from "@/domain/admin/repositories/IAdminRepository";
import type { AdminMetrics, AdminTrainerStat, AiUsageStats } from "@/lib/types";

export class SupabaseAdminRepository implements IAdminRepository {
  async getMetrics(): Promise<AdminMetrics> {
    const admin = createAdminClient();

    const [studentsResult, assessmentsResult, analysesResult, usersResult] =
      await Promise.all([
        admin.from("students").select("user_id"),
        admin.from("assessments").select("user_id"),
        admin.from("ai_analyses").select("status, duration_ms, input_tokens, output_tokens"),
        admin.auth.admin.listUsers({ perPage: 1000 }),
      ]);

    const students = studentsResult.data ?? [];
    const assessments = assessmentsResult.data ?? [];
    const analyses = analysesResult.data ?? [];
    const users = usersResult.data?.users ?? [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newTrainersLast30Days = users.filter(
      (u) => new Date(u.created_at) >= thirtyDaysAgo
    ).length;

    const aiAnalysesByStatus = { done: 0, pending: 0, running: 0, error: 0 };
    for (const a of analyses) {
      const s = a.status as keyof typeof aiAnalysesByStatus;
      if (s in aiAnalysesByStatus) aiAnalysesByStatus[s]++;
    }

    const doneWithDuration = analyses.filter(
      (a) => a.status === "done" && a.duration_ms != null
    );
    const avgDurationMs =
      doneWithDuration.length > 0
        ? Math.round(
            doneWithDuration.reduce((sum, a) => sum + (a.duration_ms ?? 0), 0) /
              doneWithDuration.length
          )
        : null;
    const totalInputTokens = analyses.reduce(
      (sum, a) => sum + (a.input_tokens ?? 0),
      0
    );
    const totalOutputTokens = analyses.reduce(
      (sum, a) => sum + (a.output_tokens ?? 0),
      0
    );
    const aiUsageStats: AiUsageStats = { avgDurationMs, totalInputTokens, totalOutputTokens };

    const signupsPerMonth: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      const count = users.filter((u) => {
        const created = new Date(u.created_at);
        return (
          created.getFullYear() === d.getFullYear() &&
          created.getMonth() === d.getMonth()
        );
      }).length;
      signupsPerMonth.push({ month: label, count });
    }

    const studentCountByUser: Record<string, number> = {};
    for (const s of students) {
      studentCountByUser[s.user_id] =
        (studentCountByUser[s.user_id] ?? 0) + 1;
    }

    const assessmentCountByUser: Record<string, number> = {};
    for (const a of assessments) {
      assessmentCountByUser[a.user_id] =
        (assessmentCountByUser[a.user_id] ?? 0) + 1;
    }

    const topTrainers: AdminTrainerStat[] = users
      .map((u) => ({
        userId: u.id,
        name:
          (u.user_metadata?.full_name as string | undefined) ||
          u.email ||
          u.id,
        email: u.email ?? "",
        studentCount: studentCountByUser[u.id] ?? 0,
        assessmentCount: assessmentCountByUser[u.id] ?? 0,
      }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 10);

    return {
      totalTrainers: users.length,
      newTrainersLast30Days,
      totalStudents: students.length,
      totalAssessments: assessments.length,
      aiAnalysesByStatus,
      aiUsageStats,
      signupsPerMonth,
      topTrainers,
    };
  }
}
