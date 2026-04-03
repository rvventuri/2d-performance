import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./_components/DashboardClient";
import type { StudentWithStats } from "./_components/DashboardClient";
import type { StudentRow } from "@/lib/supabase/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Fetch all students for this trainer
  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (studentsError) throw studentsError;

  const students = (studentsData ?? []) as StudentRow[];

  // 2. Fetch assessment stats in ONE batch query instead of N individual queries.
  //    This reduces N+1 to exactly 2 database round-trips.
  let assessmentRows: Array<{ student_id: string; date: string }> = [];
  if (students.length > 0) {
    const { data: statsData } = await supabase
      .from("assessments")
      .select("student_id, date")
      .in("student_id", students.map((s) => s.id));
    assessmentRows = statsData ?? [];
  }

  // 3. Aggregate stats per student in memory
  const countByStudent: Record<string, number> = {};
  const lastDateByStudent: Record<string, string> = {};

  for (const row of assessmentRows) {
    countByStudent[row.student_id] = (countByStudent[row.student_id] ?? 0) + 1;
    const prev = lastDateByStudent[row.student_id];
    if (!prev || row.date > prev) {
      lastDateByStudent[row.student_id] = row.date;
    }
  }

  const totalAssessments = assessmentRows.length;

  const studentsWithStats: StudentWithStats[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    age: s.age ?? 0,
    objective: s.objective ?? "",
    photoUrl: s.photo_url ?? null,
    assessmentCount: countByStudent[s.id] ?? 0,
    lastAssessmentDate: lastDateByStudent[s.id] ?? null,
  }));

  return <DashboardClient students={studentsWithStats} totalAssessments={totalAssessments} />;
}
