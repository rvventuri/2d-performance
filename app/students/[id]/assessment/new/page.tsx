"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getStudent, getMetricConfigs } from "@/lib/storage";
import { Student, Metrics } from "@/lib/types";
import { createAssessmentAction } from "../_actions";
import {
  resolveMetricConfigs,
  getEnabledMetrics,
  isLegacyAssessmentMetricKey,
} from "@/domain/trainer/services/MetricConfigResolver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ClipboardPlus, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY_METRICS: Record<keyof Metrics, string> = {
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
};

function emptyMetricsObject(): Metrics {
  return {
    cmj: null,
    sj: null,
    abalakov: null,
    rsi: null,
    tempoContato: null,
    alturaSaltoDJ: null,
    cmjEsquerdo: null,
    cmjDireito: null,
    assimetriaPercentual: null,
    saltoHorizontal: null,
  };
}

export default function NewAssessmentPage() {
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [metrics, setMetrics] = useState<Record<keyof Metrics, string>>({ ...EMPTY_METRICS });
  const [customMetricValues, setCustomMetricValues] = useState<Record<string, string>>({});
  const [resolvedMetrics, setResolvedMetrics] = useState<ReturnType<typeof resolveMetricConfigs>>([]);
  const [isPending, startTransition] = useTransition();

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

  const enabledList = useMemo(
    () => getEnabledMetrics(resolvedMetrics),
    [resolvedMetrics]
  );

  const legacyEnabled = useMemo(
    () =>
      [...enabledList]
        .filter((m) => isLegacyAssessmentMetricKey(m.key))
        .sort((a, b) => a.displayOrder - b.displayOrder || a.key.localeCompare(b.key)),
    [enabledList]
  );

  const otherEnabled = useMemo(
    () =>
      [...enabledList]
        .filter((m) => !isLegacyAssessmentMetricKey(m.key))
        .sort((a, b) => a.displayOrder - b.displayOrder || a.key.localeCompare(b.key)),
    [enabledList]
  );

  const metricLabel = (key: string) => resolvedMetrics.find((m) => m.key === key)?.label ?? key;

  const metricUnit = (key: string) => resolvedMetrics.find((m) => m.key === key)?.unit ?? "";

  const handleMetricChange = useCallback((field: keyof Metrics, value: string) => {
    setMetrics((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "cmjEsquerdo" || field === "cmjDireito") {
        const left = Number(field === "cmjEsquerdo" ? value : prev.cmjEsquerdo);
        const right = Number(field === "cmjDireito" ? value : prev.cmjDireito);
        if (left > 0 && right > 0) {
          const max = Math.max(left, right);
          const min = Math.min(left, right);
          updated.assimetriaPercentual = (((max - min) / max) * 100).toFixed(1);
        }
      }
      return updated;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (enabledList.length === 0) {
      toast.error("Configure suas métricas em Configurações antes de registrar uma avaliação.");
      return;
    }

    const parsedMetrics = emptyMetricsObject();
    for (const m of legacyEnabled) {
      const field = m.key as keyof Metrics;
      const raw = metrics[field];
      if (raw !== "") parsedMetrics[field] = Number(raw);
    }

    const parsedCustom: Record<string, number | null> = {};
    for (const m of otherEnabled) {
      const raw = customMetricValues[m.key] ?? "";
      if (raw !== "") parsedCustom[m.key] = Number(raw);
    }

    startTransition(async () => {
      try {
        await createAssessmentAction({
          studentId: id,
          date,
          metrics: parsedMetrics,
          customMetrics: parsedCustom,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar avaliação");
      }
    });
  };

  if (!student)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary-bright" />
      </div>
    );

  const catalogEmpty = enabledList.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href={`/students/${id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground tracking-wide">NOVA AVALIAÇÃO</h1>
        <p className="text-muted-foreground text-sm mt-1">{student.name}</p>
      </div>

      {catalogEmpty && (
        <div className="mb-6 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-4">
          <p className="text-foreground text-sm font-medium">Nenhuma métrica no catálogo</p>
          <p className="text-muted-foreground text-xs mt-1">
            Aplique um template ou crie métricas em Configurações para liberar este formulário.
          </p>
          <Link
            href="/settings?tab=metricas"
            className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-brand-primary-hover"
          >
            Ir para métricas
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {legacyEnabled.length > 0 && (
          <div
            className="bg-card border border-border rounded-xl p-5"
            style={{ borderLeftWidth: "3px", borderLeftColor: "#4f46e5" }}
          >
            <div className="mb-4">
              <h3 className="font-heading text-lg font-bold text-foreground tracking-wide">
                Métricas da avaliação
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Campos mapeados às colunas de salto/potência (quando aplicável).
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {legacyEnabled.map((m) => {
                const field = m.key as keyof Metrics;
                const isAutoCalc =
                  field === "assimetriaPercentual" && metrics.cmjEsquerdo !== "" && metrics.cmjDireito !== "";
                const unit = metricUnit(m.key);
                const label = metricLabel(m.key);
                return (
                  <div key={m.key} className="space-y-2">
                    <Label
                      htmlFor={m.key}
                      className="text-muted-foreground text-xs font-medium uppercase tracking-wider flex items-center gap-1"
                    >
                      {label}
                      {isAutoCalc && (
                        <span className="text-brand-primary-bright text-xs normal-case font-normal">(auto)</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id={m.key}
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={metrics[field]}
                        onChange={(e) => handleMetricChange(field, e.target.value)}
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
        )}

        {otherEnabled.length > 0 && (
          <div
            className="bg-card border border-border rounded-xl p-5"
            style={{ borderLeftWidth: "3px", borderLeftColor: "#8B5CF6" }}
          >
            <div className="mb-4">
              <h3 className="font-heading text-lg font-bold text-foreground tracking-wide">Outras métricas</h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Valores armazenados como métricas flexíveis por avaliação.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {otherEnabled.map((m) => (
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

        {!catalogEmpty && (
          <div className="flex items-center gap-2 p-3 bg-card border border-border/50 rounded-lg">
            <Info className="w-4 h-4 text-brand-primary-bright shrink-0" />
            <p className="text-muted-foreground text-xs">
              Campos vazios são ignorados na análise. Com CMJ esquerdo e direito preenchidos, a assimetria
              % pode ser calculada automaticamente.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending || catalogEmpty}
            className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-bold cursor-pointer flex-1 h-12 text-base disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ClipboardPlus className="w-5 h-5 mr-2" />
            )}
            {isPending ? "Salvando..." : "Salvar Avaliação"}
          </Button>
          <Link href={`/students/${id}`}>
            <Button
              type="button"
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-12"
            >
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
