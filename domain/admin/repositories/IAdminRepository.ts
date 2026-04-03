import type { AdminMetrics } from "@/lib/types";

export interface IAdminRepository {
  getMetrics(): Promise<AdminMetrics>;
}
