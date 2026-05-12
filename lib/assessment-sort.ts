/**
 * Ordenação cronológica única do app: data ASC, depois created_at ASC.
 * Use nas queries Supabase: .order("date", { ascending: true }).order("created_at", { ascending: true })
 */
export type ChronologicalAssessmentRow = {
  date: string;
  created_at: string;
};

export function compareAssessmentChronological(
  a: ChronologicalAssessmentRow,
  b: ChronologicalAssessmentRow
): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  return a.created_at.localeCompare(b.created_at);
}

export function sortAssessmentsChronologically<T extends ChronologicalAssessmentRow>(rows: T[]): T[] {
  return [...rows].sort(compareAssessmentChronological);
}
