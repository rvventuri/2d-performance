import { MetricConfig } from "@/lib/types";
import { IMetricConfigRepository } from "@/domain/trainer/repositories/IMetricConfigRepository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMetricConfig(row: any): MetricConfig {
  return {
    id: row.id,
    userId: row.user_id,
    metricKey: row.metric_key,
    label: row.label,
    unit: row.unit ?? "",
    higherIsBetter: row.higher_is_better,
    isCustom: row.is_custom,
    isEnabled: row.is_enabled,
    benchRecreational: row.bench_recreational ?? null,
    benchTrained: row.bench_trained ?? null,
    benchElite: row.bench_elite ?? null,
    weight: Number(row.weight),
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
  };
}

export class SupabaseMetricConfigRepository implements IMetricConfigRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly supabase: any, private readonly userId: string) {}

  async getByUserId(userId: string): Promise<MetricConfig[]> {
    const { data, error } = await this.supabase
      .from("metric_configs")
      .select("*")
      .eq("user_id", userId)
      .order("display_order", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToMetricConfig);
  }

  async upsert(
    userId: string,
    config: Omit<MetricConfig, "id" | "userId" | "createdAt">
  ): Promise<MetricConfig> {
    const { data, error } = await this.supabase
      .from("metric_configs")
      .upsert(
        {
          user_id: userId,
          metric_key: config.metricKey,
          label: config.label,
          unit: config.unit,
          higher_is_better: config.higherIsBetter,
          is_custom: config.isCustom,
          is_enabled: config.isEnabled,
          bench_recreational: config.benchRecreational,
          bench_trained: config.benchTrained,
          bench_elite: config.benchElite,
          weight: config.weight,
          display_order: config.displayOrder,
        },
        { onConflict: "user_id,metric_key" }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToMetricConfig(data);
  }

  async delete(userId: string, metricKey: string): Promise<void> {
    const { error } = await this.supabase
      .from("metric_configs")
      .delete()
      .eq("user_id", userId)
      .eq("metric_key", metricKey);

    if (error) throw new Error(error.message);
  }
}
