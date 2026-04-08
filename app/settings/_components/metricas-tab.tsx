"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RotateCcw, Trash2, LayoutTemplate, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResolvedMetricConfig } from "@/lib/types";
import { DEFAULT_METRIC_MAP } from "@/domain/trainer/services/DefaultMetrics";
import { METRIC_TEMPLATES } from "@/domain/trainer/services/MetricTemplates";
import { isLegacyAssessmentMetricKey } from "@/domain/trainer/services/MetricConfigResolver";
import {
  saveMetricConfig,
  deleteCustomMetric,
  invalidateAllAnalyses,
  applyMetricTemplate,
} from "../_actions";
import { AddCustomMetricModal } from "./add-custom-metric-modal";

interface Props {
  resolvedMetrics: ResolvedMetricConfig[];
}

const WEIGHT_OPTIONS = ["0", "0.5", "1", "1.5", "2", "2.5", "3"];

export function MetricasTab({ resolvedMetrics: initialResolved }: Props) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ResolvedMetricConfig[]>(initialResolved);

  useEffect(() => {
    setMetrics(initialResolved);
  }, [initialResolved]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [, startApplyTransition] = useTransition();

  const sortedMetrics = [...metrics].sort((a, b) => a.displayOrder - b.displayOrder || a.key.localeCompare(b.key));

  const updateMetric = async (key: string, changes: Partial<ResolvedMetricConfig>) => {
    const metric = metrics.find((m) => m.key === key);
    if (!metric) return;
    const updated = { ...metric, ...changes };
    setMetrics((prev) => prev.map((m) => (m.key === key ? updated : m)));

    const result = await saveMetricConfig({
      metricKey: updated.key,
      label: updated.label,
      unit: updated.unit,
      higherIsBetter: updated.higherIsBetter,
      isCustom: updated.isCustom,
      isEnabled: updated.isEnabled,
      benchRecreational: updated.benchRecreational,
      benchTrained: updated.benchTrained,
      benchElite: updated.benchElite,
      weight: updated.weight,
      displayOrder: updated.displayOrder,
    });
    if (!result.ok) {
      toast.error(result.error);
    } else {
      await invalidateAllAnalyses();
    }
  };

  const handleReset = async (key: string) => {
    const def = DEFAULT_METRIC_MAP[key];
    if (!def) return;
    await updateMetric(key, {
      label: def.label,
      unit: def.unit,
      higherIsBetter: def.higherIsBetter,
      benchRecreational: def.benchRecreational,
      benchTrained: def.benchTrained,
      benchElite: def.benchElite,
      weight: 1.0,
      isEnabled: true,
    });
    toast.success("Métrica redefinida para o padrão de referência (salto)");
  };

  const handleDelete = async (key: string) => {
    const result = await deleteCustomMetric(key);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setMetrics((prev) => prev.filter((m) => m.key !== key));
    toast.success("Métrica excluída");
    router.refresh();
  };

  const handleApplyTemplate = (templateId: string) => {
    setApplyingId(templateId);
    startApplyTransition(async () => {
      const result = await applyMetricTemplate(templateId);
      setApplyingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Template aplicado: ${result.appliedCount} métrica(s) adicionadas ou atualizadas.`
      );
      router.refresh();
    });
  };

  return (
    <div className="mt-6 space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-1">
          <LayoutTemplate className="w-4 h-4 text-brand-primary-bright" />
          <h3 className="text-foreground font-semibold">Templates por persona</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          Adicione um pacote de métricas ao seu catálogo (mescla por chave: métricas já existentes são
          atualizadas). Você pode editar, desativar ou excluir depois.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {METRIC_TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
            >
              <div>
                <p className="font-medium text-foreground text-sm">{t.title}</p>
                <p className="text-muted-foreground text-xs mt-1 leading-snug">{t.description}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto border-border cursor-pointer"
                disabled={applyingId !== null}
                onClick={() => handleApplyTemplate(t.id)}
              >
                {applyingId === t.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Aplicando…
                  </>
                ) : (
                  "Adicionar ao catálogo"
                )}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h3 className="text-foreground font-semibold mb-1">Seu catálogo</h3>
            <p className="text-muted-foreground text-sm">
              Todas as métricas disponíveis nas avaliações e na IA. Lista vazia até você aplicar um template
              ou criar métricas.
            </p>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            size="sm"
            className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova métrica
          </Button>
        </div>

        {sortedMetrics.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma métrica ainda. Escolha um template acima ou crie uma métrica personalizada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMetrics.map((m) => (
              <MetricRow
                key={m.key}
                metric={m}
                onUpdate={(changes) => updateMetric(m.key, changes)}
                onReset={DEFAULT_METRIC_MAP[m.key] ? () => handleReset(m.key) : undefined}
                onDelete={() => handleDelete(m.key)}
              />
            ))}
          </div>
        )}
      </section>

      <AddCustomMetricModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={(metric) => {
          setMetrics((prev) => [
            ...prev,
            {
              key: metric.metricKey,
              label: metric.label,
              unit: metric.unit,
              higherIsBetter: metric.higherIsBetter,
              benchRecreational: metric.benchRecreational ?? 0,
              benchTrained: metric.benchTrained ?? 0,
              benchElite: metric.benchElite ?? 0,
              isEnabled: metric.isEnabled,
              weight: metric.weight,
              isCustom: true,
              displayOrder: metric.displayOrder,
            },
          ]);
          router.refresh();
        }}
        displayOrder={
          metrics.length === 0 ? 0 : Math.max(...metrics.map((m) => m.displayOrder), -1) + 1
        }
      />
    </div>
  );
}

interface MetricRowProps {
  metric: ResolvedMetricConfig;
  onUpdate: (changes: Partial<ResolvedMetricConfig>) => void;
  onReset?: () => void;
  onDelete?: () => void;
}

function MetricRow({ metric, onUpdate, onReset, onDelete }: MetricRowProps) {
  const def = DEFAULT_METRIC_MAP[metric.key];
  const jumpBadge = isLegacyAssessmentMetricKey(metric.key);

  return (
    <div
      className={`bg-card border rounded-xl p-4 transition-opacity ${
        metric.isEnabled ? "border-border" : "border-border opacity-50"
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => onUpdate({ isEnabled: !metric.isEnabled })}
          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
            metric.isEnabled ? "bg-brand-primary" : "bg-secondary"
          }`}
          title={metric.isEnabled ? "Desabilitar" : "Habilitar"}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-primary-foreground rounded-full shadow-sm transition-transform ${
              metric.isEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>

        <div className="flex-1 min-w-[120px]">
          <div className="flex items-center gap-2 mb-1">
            {jumpBadge && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                Salto
              </span>
            )}
          </div>
          <Input
            value={metric.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="bg-secondary border-border text-foreground h-8 text-sm focus:border-brand-primary-bright"
          />
        </div>

        <div className="w-16">
          <Input
            value={metric.unit}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            placeholder="un."
            className="bg-secondary border-border text-foreground h-8 text-sm placeholder:text-muted-foreground focus:border-brand-primary-bright"
          />
        </div>

        <div className="flex gap-1.5 items-center">
          <span className="text-muted-foreground text-xs hidden sm:block">Ref:</span>
          {(["benchRecreational", "benchTrained", "benchElite"] as const).map((bKey, i) => (
            <div key={bKey} className="w-16">
              <Input
                type="number"
                step="any"
                value={metric[bKey] ?? ""}
                onChange={(e) =>
                  onUpdate({ [bKey]: e.target.value ? Number(e.target.value) : null })
                }
                placeholder={def ? String(def[bKey]) : ["Rec", "Trein", "Elite"][i]}
                className="bg-secondary border-border text-foreground h-8 text-xs placeholder:text-muted-foreground/40 focus:border-brand-primary-bright"
                title={["Recreativo", "Treinado", "Elite"][i]}
              />
            </div>
          ))}
        </div>

        <div className="w-24">
          <select
            value={String(metric.weight)}
            onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
            className="w-full h-8 bg-secondary border border-border text-foreground rounded-md px-2 text-xs focus:outline-none focus:border-brand-primary-bright cursor-pointer"
            title="Peso no score geral"
          >
            {WEIGHT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v === "0" ? "0× off" : v === "1" ? "1× normal" : `${v}×`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-pointer transition-colors"
              title="Redefinir referência (salto)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer transition-colors"
              title="Excluir métrica"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
