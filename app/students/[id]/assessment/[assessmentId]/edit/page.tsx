"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStudent, getMetricConfigs, getStudentAssessments } from "@/lib/storage";
import { Assessment, Metrics, Student } from "@/lib/types";
import { updateAssessmentAction } from "../../_actions";
import { resolveMetricConfigs } from "@/domain/trainer/services/MetricConfigResolver";
import AssessmentEntryForm, { EMPTY_METRICS } from "../../_components/AssessmentEntryForm";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function metricsToFormStrings(m: Metrics): Record<keyof Metrics, string> {
  const out = { ...EMPTY_METRICS };
  (Object.keys(m) as (keyof Metrics)[]).forEach((k) => {
    const v = m[k];
    if (v != null && Number.isFinite(Number(v))) {
      out[k] = String(v);
    }
  });
  return out;
}

function assimetriaIsManualOverride(m: Metrics): boolean {
  if (m.assimetriaPercentual == null) return false;
  const left = Number(m.cmjEsquerdo);
  const right = Number(m.cmjDireito);
  if (!Number.isFinite(left) || !Number.isFinite(right) || left <= 0 || right <= 0) return true;
  const max = Math.max(left, right);
  const min = Math.min(left, right);
  const sug = ((max - min) / max) * 100;
  return Math.abs(Number(m.assimetriaPercentual) - sug) > 0.05;
}

function customMetricsToStrings(cm: Record<string, number | null> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cm) return out;
  for (const [k, v] of Object.entries(cm)) {
    if (v != null && Number.isFinite(Number(v))) out[k] = String(v);
  }
  return out;
}

export default function EditAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const assessmentId = params.assessmentId as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [resolvedMetrics, setResolvedMetrics] = useState<ReturnType<typeof resolveMetricConfigs>>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStudent(studentId), getMetricConfigs(), getStudentAssessments(studentId)]).then(
      ([s, configs, assessments]) => {
        if (cancelled) return;
        if (!s) {
          window.location.href = "/dashboard";
          return;
        }
        const latest = assessments.length > 0 ? assessments[assessments.length - 1] : null;
        if (!latest || latest.id !== assessmentId) {
          toast.error("Só é possível editar a avaliação mais recente do atleta.");
          router.replace(`/students/${studentId}`);
          return;
        }
        setStudent(s);
        setResolvedMetrics(resolveMetricConfigs(configs));
        setAssessment(latest);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [studentId, assessmentId, router]);

  const initialMetrics = useMemo(
    () => (assessment ? metricsToFormStrings(assessment.metrics) : { ...EMPTY_METRICS }),
    [assessment]
  );

  const initialCustom = useMemo(
    () => (assessment ? customMetricsToStrings(assessment.customMetrics) : {}),
    [assessment]
  );

  const initialAssimetriaManual = useMemo(
    () => (assessment ? assimetriaIsManualOverride(assessment.metrics) : false),
    [assessment]
  );

  if (!student || !assessment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary-bright" />
      </div>
    );
  }

  return (
    <AssessmentEntryForm
      formKey={assessmentId}
      studentId={studentId}
      studentName={student.name}
      resolvedMetrics={resolvedMetrics}
      initialDate={assessment.date}
      initialMetrics={initialMetrics}
      initialCustomMetricValues={initialCustom}
      initialAssimetriaOverrideManual={initialAssimetriaManual}
      pageTitle="EDITAR AVALIAÇÃO"
      submitLabel="Salvar alterações"
      submitPendingLabel="Salvando..."
      backHref={`/students/${studentId}`}
      onSubmit={async ({ date, metrics, customMetrics }) => {
        await updateAssessmentAction({
          studentId,
          assessmentId,
          date,
          metrics,
          customMetrics,
        });
      }}
    />
  );
}
