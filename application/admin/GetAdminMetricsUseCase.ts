import type { IAdminRepository } from "@/domain/admin/repositories/IAdminRepository";
import type { AdminMetrics } from "@/lib/types";

export class GetAdminMetricsUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(): Promise<AdminMetrics> {
    return this.repo.getMetrics();
  }
}
