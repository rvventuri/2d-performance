import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./_components/DashboardClient";
import type { StudentWithStats, OnboardingState } from "./_components/DashboardClient";
import type { StudentRow } from "@/lib/supabase/database.types";
import { MODALITY_PICKER_OPTIONS } from "@/domain/trainer/services/MetricTemplates";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: studentsData, error: studentsError },
    { data: profileData },
    { count: metricConfigCount },
    { data: demoState },
  ] = await Promise.all([
    supabase.from("students").select("*").order("created_at", { ascending: false }),
    supabase.from("trainer_profiles").select("coaching_philosophy,sport_context").eq("user_id", user.id).single(),
    supabase
      .from("metric_configs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_demo_state")
      .select("modality_chosen_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (studentsError) throw studentsError;

  const students = (studentsData ?? []) as StudentRow[];

  let assessmentRows: Array<{ student_id: string; date: string }> = [];
  if (students.length > 0) {
    const { data: statsData } = await supabase
      .from("assessments")
      .select("student_id, date")
      .in("student_id", students.map((s) => s.id));
    assessmentRows = statsData ?? [];
  }

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

  const hasDemoData = students.some((s) => s.is_demo === true);

  const studentsWithStats: StudentWithStats[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    age: s.age ?? 0,
    objective: s.objective ?? "",
    photoUrl: s.photo_url ?? null,
    isDemo: s.is_demo === true,
    assessmentCount: countByStudent[s.id] ?? 0,
    lastAssessmentDate: lastDateByStudent[s.id] ?? null,
  }));

  const modalityChosen = Boolean(
    (demoState as { modality_chosen_at?: string | null } | null)?.modality_chosen_at
  );

  const onboardingState: OnboardingState = {
    hasMetricCatalog: (metricConfigCount ?? 0) > 0,
    isProfileConfigured: !!(
      profileData?.coaching_philosophy || profileData?.sport_context
    ),
    hasStudents: students.length > 0,
    hasAssessments: totalAssessments > 0,
    firstStudentId: students[0]?.id ?? null,
  };

  return (
    <DashboardClient
      students={studentsWithStats}
      totalAssessments={totalAssessments}
      onboardingState={onboardingState}
      hasDemoData={hasDemoData}
      needsModalityPicker={!modalityChosen}
      modalityOptions={MODALITY_PICKER_OPTIONS}
    />
  );
}
