"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getStudent, getMetricConfigs } from "@/lib/storage";
import { Student, Metrics } from "@/lib/types";
import { createAssessmentAction } from "../_actions";
import { resolveMetricConfigs, getEnabledMetrics } from "@/domain/trainer/services/MetricConfigResolver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ClipboardPlus, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_METRIC_GROUPS = [
  {
    title: "Saltos Bilaterais",
    description: "Métricas de salto vertical bilateral",
    color: "#4f46e5",
    fields: ["cmj", "sj", "abalakov"],
  },
  {
    title: "Reatividade",
    description: "Drop Jump e capacidade reativa",
    color: "#6366f1",
    fields: ["rsi", "tempoContato", "alturaSaltoDJ"],
  },
  {
    title: "Assimetria",
    description: "Comparativo entre membros",
    color: "#F59E0B",
    fields: ["cmjEsquerdo", "cmjDireito", "assimetriaPercentual"],
  },
  {
    title: "Salto Horizontal",
    description: "Potência em extensão horizontal",
    color: "#EC4899",
    fields: ["saltoHorizontal"],
  },
];

export default function NewAssessmentPage() {
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [metrics, setMetrics] = useState<Record<keyof Metrics, string>>({
    cmj: "",
    sj: "",
    abalakov: "",
    rsi: "",
    tempoContato: "",
    alturaSaltoDJ: "",
    cmjEsquerdo: "",
    cmjDireito: "",
    assimetriaPercentual: "",
    saltoHorizontal: "",
  });
  const [customMetricValues, setCustomMetricValues] = useState<Record<string, string>>({});
  const [resolvedMetrics, setResolvedMetrics] = useState<ReturnType<typeof resolveMetricConfigs>>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    Promise.all([
      getStudent(id),
      getMetricConfigs(),
    ]).then(([s, configs]) => {
      if (!s) { window.location.href = "/dashboard"; return; }
      setStudent(s);
      setResolvedMetrics(resolveMetricConfigs(configs));
    });
  }, [id]);

  const enabledDefaultKeys = new Set(
    getEnabledMetrics(resolvedMetrics)
      .filter((m) => !m.isCustom)
      .map((m) => m.key)
  );

  const enabledCustomMetrics = getEnabledMetrics(resolvedMetrics).filter((m) => m.isCustom);

  const metricLabel = (key: string) =>
    resolvedMetrics.find((m) => m.key === key)?.label ?? key;

  const metricUnit = (key: string) =>
    resolvedMetrics.find((m) => m.key === key)?.unit ?? "";

  const handleMetricChange = useCallback((field: keyof Metrics, value: string) => {
    setMetrics((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "cmjEsquerdo" || field === "cmjDireito") {
        const left = Number(field === "cmjEsquerdo" ? value : prev.cmjEsquerdo);
        const right = Number(field === "cmjDireito" ? value : prev.cmjDireito);
        if (left > 0 && right > 0) {
          const max = Math.max(left, right);
          const min = Math.min(left, right);
          updated.assimetriaPercentual = ((max - min) / max * 100).toFixed(1);
        }
      }
      return updated;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMetrics: Metrics = {
      cmj: metrics.cmj !== "" ? Number(metrics.cmj) : null,
      sj: metrics.sj !== "" ? Number(metrics.sj) : null,
      abalakov: metrics.abalakov !== "" ? Number(metrics.abalakov) : null,
      rsi: metrics.rsi !== "" ? Number(metrics.rsi) : null,
      tempoContato: metrics.tempoContato !== "" ? Number(metrics.tempoContato) : null,
      alturaSaltoDJ: metrics.alturaSaltoDJ !== "" ? Number(metrics.alturaSaltoDJ) : null,
      cmjEsquerdo: metrics.cmjEsquerdo !== "" ? Number(metrics.cmjEsquerdo) : null,
      cmjDireito: metrics.cmjDireito !== "" ? Number(metrics.cmjDireito) : null,
      assimetriaPercentual: metrics.assimetriaPercentual !== "" ? Number(metrics.assimetriaPercentual) : null,
      saltoHorizontal: metrics.saltoHorizontal !== "" ? Number(metrics.saltoHorizontal) : null,
    };

    const parsedCustom: Record<string, number | null> = {};
    for (const [key, val] of Object.entries(customMetricValues)) {
      if (val !== "") parsedCustom[key] = Number(val);
    }

    startTransition(async () => {
      try {
        await createAssessmentAction({
          studentId: id,
          date,
          metrics: parsedMetrics,
          customMetrics: parsedCustom,
        });
        // redirect() inside the action navigates automatically
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar avaliação");
      }
    });
  };

  if (!student) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-brand-primary-bright" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href={`/students/${id}`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground tracking-wide">NOVA AVALIAÇÃO</h1>
        <p className="text-muted-foreground text-sm mt-1">{student.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="space-y-2 max-w-xs">
            <Label className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
              Data da Avaliação
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-secondary border-border text-foreground focus:border-brand-primary-bright h-11"
            />
          </div>
        </div>

        {/* Default metric groups (filtered by enabled metrics) */}
        {DEFAULT_METRIC_GROUPS.map((group) => {
          const visibleFields = group.fields.filter((f) => enabledDefaultKeys.has(f));
          if (visibleFields.length === 0) return null;
          return (
            <div
              key={group.title}
              className="bg-card border border-border rounded-xl p-5"
              style={{ borderLeftWidth: "3px", borderLeftColor: group.color }}
            >
              <div className="mb-4">
                <h3 className="font-heading text-lg font-bold text-foreground tracking-wide">{group.title}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{group.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {visibleFields.map((field) => {
                  const isAutoCalc = field === "assimetriaPercentual" && metrics.cmjEsquerdo !== "" && metrics.cmjDireito !== "";
                  const unit = metricUnit(field);
                  const label = metricLabel(field);
                  return (
                    <div key={field} className="space-y-2">
                      <Label
                        htmlFor={field}
                        className="text-muted-foreground text-xs font-medium uppercase tracking-wider flex items-center gap-1"
                      >
                        {label}
                        {isAutoCalc && (
                          <span className="text-brand-primary-bright text-xs normal-case font-normal">(auto)</span>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id={field}
                          type="number"
                          step="0.01"
                          placeholder="—"
                          value={metrics[field as keyof Metrics]}
                          onChange={(e) => handleMetricChange(field as keyof Metrics, e.target.value)}
                          readOnly={isAutoCalc}
                          className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground/40 focus:border-brand-primary-bright h-11 ${
                            unit ? "pr-12" : ""
                          } ${isAutoCalc ? "opacity-70 cursor-default" : ""}`}
                        />
                        {unit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                            {unit}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Custom metrics group */}
        {enabledCustomMetrics.length > 0 && (
          <div
            className="bg-card border border-border rounded-xl p-5"
            style={{ borderLeftWidth: "3px", borderLeftColor: "#8B5CF6" }}
          >
            <div className="mb-4">
              <h3 className="font-heading text-lg font-bold text-foreground tracking-wide">Métricas Personalizadas</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Métricas específicas do seu método de avaliação</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {enabledCustomMetrics.map((m) => (
                <div key={m.key} className="space-y-2">
                  <Label
                    htmlFor={`custom_${m.key}`}
                    className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
                  >
                    {m.label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`custom_${m.key}`}
                      type="number"
                      step="0.01"
                      placeholder="—"
                      value={customMetricValues[m.key] ?? ""}
                      onChange={(e) =>
                        setCustomMetricValues((prev) => ({ ...prev, [m.key]: e.target.value }))
                      }
                      className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground/40 focus:border-brand-primary-bright h-11 ${
                        m.unit ? "pr-12" : ""
                      }`}
                    />
                    {m.unit && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        {m.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-card border border-border/50 rounded-lg">
          <Info className="w-4 h-4 text-brand-primary-bright shrink-0" />
          <p className="text-muted-foreground text-xs">
            Campos não preenchidos serão ignorados na análise. A assimetria é calculada automaticamente a partir do CMJ esquerdo e direito.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-bold cursor-pointer flex-1 h-12 text-base"
          >
            {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ClipboardPlus className="w-5 h-5 mr-2" />}
            {isPending ? "Salvando..." : "Salvar Avaliação"}
          </Button>
          <Link href={`/students/${id}`}>
            <Button type="button" variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-12">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
