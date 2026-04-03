import { MetricConfig } from "@/lib/types";

export interface IMetricConfigRepository {
  getByUserId(userId: string): Promise<MetricConfig[]>;
  upsert(userId: string, config: Omit<MetricConfig, "id" | "userId" | "createdAt">): Promise<MetricConfig>;
  delete(userId: string, metricKey: string): Promise<void>;
}
