import { Assessment, Metrics } from "@/lib/types";
import { IAssessmentRepository } from "@/domain/assessment/repositories/IAssessmentRepository";
import type { AssessmentRow, CustomMetricValueRow } from "@/lib/supabase/database.types";

function rowToAssessment(row: AssessmentRow): Assessment {
  const metrics: Metrics = {
    cmj: row.cmj,
    sj: row.sj,
    abalakov: row.abalakov,
    rsi: row.rsi,
    tempoContato: row.tempo_contato,
    alturaSaltoDJ: row.altura_salto_dj,
    cmjEsquerdo: row.cmj_esquerdo,
    cmjDireito: row.cmj_direito,
    assimetriaPercentual: row.assimetria_percentual,
    saltoHorizontal: row.salto_horizontal,
  };
  return { id: row.id, studentId: row.student_id, date: row.date, metrics };
}

export class SupabaseAssessmentRepository implements IAssessmentRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly supabase: any, private readonly userId: string) {}

  async getByStudentId(studentId: string): Promise<Assessment[]> {
    const { data, error } = await this.supabase
      .from("assessments")
      .select("*")
      .eq("student_id", studentId)
      .eq("user_id", this.userId)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const assessments = ((data ?? []) as AssessmentRow[]).map(rowToAssessment);
    if (assessments.length === 0) return assessments;

    // Batch-load custom metric values
    const ids = assessments.map((a) => a.id);
    const { data: cvRows } = await this.supabase
      .from("custom_metric_values")
      .select("*")
      .in("assessment_id", ids);

    const cvByAssessment: Record<string, Record<string, number | null>> = {};
    for (const cv of (cvRows ?? []) as CustomMetricValueRow[]) {
      if (!cvByAssessment[cv.assessment_id]) cvByAssessment[cv.assessment_id] = {};
      cvByAssessment[cv.assessment_id][cv.metric_key] = cv.value ?? null;
    }

    return assessments.map((a) => ({
      ...a,
      customMetrics: cvByAssessment[a.id] ?? {},
    }));
  }

  async create(input: Omit<Assessment, "id">): Promise<Assessment> {
    const { data, error } = await this.supabase
      .from("assessments")
      .insert({
        student_id: input.studentId,
        user_id: this.userId,
        date: input.date,
        cmj: input.metrics.cmj,
        sj: input.metrics.sj,
        abalakov: input.metrics.abalakov,
        rsi: input.metrics.rsi,
        tempo_contato: input.metrics.tempoContato,
        altura_salto_dj: input.metrics.alturaSaltoDJ,
        cmj_esquerdo: input.metrics.cmjEsquerdo,
        cmj_direito: input.metrics.cmjDireito,
        assimetria_percentual: input.metrics.assimetriaPercentual,
        salto_horizontal: input.metrics.saltoHorizontal,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToAssessment(data as AssessmentRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("assessments")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);

    if (error) throw new Error(error.message);
  }
}
