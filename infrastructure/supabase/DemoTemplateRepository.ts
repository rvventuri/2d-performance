import type { SupabaseClient } from "@supabase/supabase-js";
import type { IDemoTemplateRepository } from "@/domain/demo/repositories/IDemoTemplateRepository";
import type {
  AiAnalysisRow,
  AssessmentRow,
  CustomMetricValueRow,
  StudentRow,
} from "@/lib/supabase/database.types";

export class SupabaseDemoTemplateRepository implements IDemoTemplateRepository {
  constructor(private readonly admin: SupabaseClient) {}

  async cloneDemoFromTemplateUser(targetUserId: string, templateUserId: string): Promise<void> {
    if (targetUserId === templateUserId) {
      throw new Error("Usuário alvo não pode ser o mesmo que o usuário seed.");
    }

    const rollbackDemoRows = async () => {
      await this.admin.from("students").delete().eq("user_id", targetUserId).eq("is_demo", true);
    };

    const { data: templateStudentsRaw, error: stErr } = await this.admin
      .from("students")
      .select("*")
      .eq("user_id", templateUserId)
      .order("id", { ascending: true });

    if (stErr) throw new Error(stErr.message);
    const templateStudents = (templateStudentsRaw ?? []) as StudentRow[];

    if (templateStudents.length === 0) {
      throw new Error(
        "Usuário seed sem alunos. Crie um usuário template no Supabase por modalidade e defina a variável de ambiente correspondente (ver lib/demo-seed-users.ts)."
      );
    }

    try {
      const sortedStudents = [...templateStudents].sort((a, b) => a.id.localeCompare(b.id));
      const studentIdMap: Record<string, string> = {};

      for (const s of sortedStudents) {
        const { data: row, error: oneStErr } = await this.admin
          .from("students")
          .insert({
            user_id: targetUserId,
            name: s.name,
            age: s.age,
            weight: s.weight,
            height: s.height,
            objective: s.objective,
            photo_url: null,
            is_demo: true,
          })
          .select("id")
          .single();

        if (oneStErr) throw new Error(oneStErr.message);
        if (!row?.id) throw new Error("Falha ao clonar aluno.");
        studentIdMap[s.id] = row.id as string;
      }

      const oldStudentIds = sortedStudents.map((s) => s.id);

      const { data: templateAssessmentsRaw, error: asErr } = await this.admin
        .from("assessments")
        .select("*")
        .in("student_id", oldStudentIds);

      if (asErr) throw new Error(asErr.message);
      const templateAssessments = (templateAssessmentsRaw ?? []) as AssessmentRow[];

      const sortedAssessments = [...templateAssessments].sort((a, b) => {
        const sid = a.student_id.localeCompare(b.student_id);
        if (sid !== 0) return sid;
        const d = a.date.localeCompare(b.date);
        if (d !== 0) return d;
        return a.id.localeCompare(b.id);
      });

      const assessmentIdMap: Record<string, string> = {};
      for (const a of sortedAssessments) {
        const { data: insertedRow, error: insAsErr } = await this.admin
          .from("assessments")
          .insert({
            student_id: studentIdMap[a.student_id],
            user_id: targetUserId,
            date: a.date,
            cmj: a.cmj,
            sj: a.sj,
            abalakov: a.abalakov,
            rsi: a.rsi,
            tempo_contato: a.tempo_contato,
            altura_salto_dj: a.altura_salto_dj,
            cmj_esquerdo: a.cmj_esquerdo,
            cmj_direito: a.cmj_direito,
            assimetria_percentual: a.assimetria_percentual,
            salto_horizontal: a.salto_horizontal,
          })
          .select("id")
          .single();

        if (insAsErr) throw new Error(insAsErr.message);
        if (!insertedRow?.id) throw new Error("Falha ao clonar avaliação.");
        assessmentIdMap[a.id] = insertedRow.id as string;
      }

      const oldAssessmentIds = Object.keys(assessmentIdMap);
      if (oldAssessmentIds.length > 0) {
        const { data: cvRows, error: cvErr } = await this.admin
          .from("custom_metric_values")
          .select("*")
          .in("assessment_id", oldAssessmentIds);

        if (cvErr) throw new Error(cvErr.message);
        const customRows = (cvRows ?? []) as CustomMetricValueRow[];
        if (customRows.length > 0) {
          const payload = customRows.map((row) => ({
            assessment_id: assessmentIdMap[row.assessment_id],
            user_id: targetUserId,
            metric_key: row.metric_key,
            value: row.value,
          }));
          const { error: insCvErr } = await this.admin.from("custom_metric_values").insert(payload);
          if (insCvErr) throw new Error(insCvErr.message);
        }
      }

      const { data: templateAnalysesRaw, error: anErr } = await this.admin
        .from("ai_analyses")
        .select("*")
        .in("student_id", oldStudentIds);

      if (anErr) throw new Error(anErr.message);
      const templateAnalyses = (templateAnalysesRaw ?? []) as AiAnalysisRow[];

      if (templateAnalyses.length > 0) {
        const analysisPayload = templateAnalyses.map((row) => {
          const newLastId = row.last_assessment_id
            ? assessmentIdMap[row.last_assessment_id] ?? null
            : null;
          return {
            student_id: studentIdMap[row.student_id],
            user_id: targetUserId,
            content: row.content,
            last_assessment_id: newLastId,
            status: row.status ?? "done",
            duration_ms: row.duration_ms,
            input_tokens: row.input_tokens,
            output_tokens: row.output_tokens,
          };
        });

        const { error: insAnErr } = await this.admin.from("ai_analyses").insert(analysisPayload);
        if (insAnErr) throw new Error(insAnErr.message);
      }
    } catch (err) {
      await rollbackDemoRows();
      throw err;
    }
  }

  async clearDemoStudents(userId: string): Promise<number> {
    const { count, error: cErr } = await this.admin
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_demo", true);

    if (cErr) throw new Error(cErr.message);

    const { error: dErr } = await this.admin
      .from("students")
      .delete()
      .eq("user_id", userId)
      .eq("is_demo", true);

    if (dErr) throw new Error(dErr.message);
    return count ?? 0;
  }

  async markDemoCleared(userId: string): Promise<void> {
    const { error } = await this.admin
      .from("user_demo_state")
      .update({ cleared_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }
}
