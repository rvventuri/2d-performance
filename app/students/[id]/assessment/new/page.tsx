"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { getStudent, getMetricConfigs } from "@/lib/storage";
import { Student } from "@/lib/types";
import { createAssessmentAction } from "../_actions";
import { resolveMetricConfigs } from "@/domain/trainer/services/MetricConfigResolver";
import AssessmentEntryForm, { EMPTY_METRICS } from "../_components/AssessmentEntryForm";
import { Loader2 } from "lucide-react";

export default function NewAssessmentPage() {
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [resolvedMetrics, setResolvedMetrics] = useState<ReturnType<typeof resolveMetricConfigs>>([]);
  const [initialDate] = useState(() => new Date().toISOString().split("T")[0]);

  const initialMetrics = useMemo(() => ({ ...EMPTY_METRICS }), []);

  useEffect(() => {
    Promise.all([getStudent(id), getMetricConfigs()]).then(([s, configs]) => {
      if (!s) {
        window.location.href = "/dashboard";
        return;
      }
      setStudent(s);
      setResolvedMetrics(resolveMetricConfigs(configs));
    });
  }, [id]);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary-bright" />
      </div>
    );
  }

  return (
    <AssessmentEntryForm
      formKey="new"
      studentId={id}
      studentName={student.name}
      resolvedMetrics={resolvedMetrics}
      initialDate={initialDate}
      initialMetrics={initialMetrics}
      initialCustomMetricValues={{}}
      initialAssimetriaOverrideManual={false}
      pageTitle="NOVA AVALIAÇÃO"
      submitLabel="Salvar Avaliação"
      submitPendingLabel="Salvando..."
      backHref={`/students/${id}`}
      onSubmit={async ({ date, metrics, customMetrics }) => {
        await createAssessmentAction({
          studentId: id,
          date,
          metrics,
          customMetrics,
        });
      }}
    />
  );
}
