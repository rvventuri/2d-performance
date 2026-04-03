export interface CustomMetricValue {
  assessmentId: string;
  metricKey: string;
  value: number | null;
}

export class SupabaseCustomMetricValueRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly supabase: any, private readonly userId: string) {}

  async getByAssessmentIds(
    assessmentIds: string[]
  ): Promise<Record<string, Record<string, number | null>>> {
    if (assessmentIds.length === 0) return {};

    const { data, error } = await this.supabase
      .from("custom_metric_values")
      .select("*")
      .in("assessment_id", assessmentIds);

    if (error) throw new Error(error.message);

    const result: Record<string, Record<string, number | null>> = {};
    for (const row of data ?? []) {
      if (!result[row.assessment_id]) result[row.assessment_id] = {};
      result[row.assessment_id][row.metric_key] = row.value ?? null;
    }
    return result;
  }

  async saveValues(
    assessmentId: string,
    values: Record<string, number | null>
  ): Promise<void> {
    const rows = Object.entries(values).map(([metricKey, value]) => ({
      assessment_id: assessmentId,
      user_id: this.userId,
      metric_key: metricKey,
      value,
    }));

    if (rows.length === 0) return;

    const { error } = await this.supabase
      .from("custom_metric_values")
      .upsert(rows, { onConflict: "assessment_id,metric_key" });

    if (error) throw new Error(error.message);
  }
}
