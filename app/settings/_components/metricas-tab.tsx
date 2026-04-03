"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MetricConfig } from "@/lib/types";
import { ResolvedMetricConfig } from "@/lib/types";
import { DEFAULT_METRIC_MAP } from "@/domain/trainer/services/DefaultMetrics";
import { saveMetricConfig, deleteCustomMetric, invalidateAllAnalyses } from "../_actions";
import { AddCustomMetricModal } from "./add-custom-metric-modal";

interface Props {
  initialConfigs: MetricConfig[];
  resolvedMetrics: ResolvedMetricConfig[];
}

const WEIGHT_OPTIONS = ["0", "0.5", "1", "1.5", "2", "2.5", "3"];

export function MetricasTab({ initialConfigs, resolvedMetrics: initialResolved }: Props) {
  const [metrics, setMetrics] = useState<ResolvedMetricConfig[]>(initialResolved);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const updateMetric = async (key: string, changes: Partial<ResolvedMetricConfig>) => {
    setMetrics((prev) =>
      prev.map((m) => (m.key === key ? { ...m, ...changes } : m))
    );
    const metric = metrics.find((m) => m.key === key)!;
    const updated = { ...metric, ...changes };

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
    toast.success("Métrica redefinida para o padrão");
  };

  const handleDelete = async (key: string) => {
    const result = await deleteCustomMetric(key);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setMetrics((prev) => prev.filter((m) => m.key !== key));
    toast.success("Métrica excluída");
  };

  const defaultMetrics = metrics.filter((m) => !m.isCustom);
  const customMetrics = metrics.filter((m) => m.isCustom);

  return (
    <div className="mt-6 space-y-8">
      {/* Default Metrics */}
      <section>
        <h3 className="text-foreground font-semibold mb-1">Métricas Padrão</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Ajuste os benchmarks, pesos e visibilidade das métricas nativas do sistema.
        </p>
        <div className="space-y-3">
          {defaultMetrics.map((m) => (
            <MetricRow
              key={m.key}
              metric={m}
              onUpdate={(changes) => updateMetric(m.key, changes)}
              onReset={() => handleReset(m.key)}
            />
          ))}
        </div>
      </section>

      {/* Custom Metrics */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-foreground font-semibold mb-1">Métricas Personalizadas</h3>
            <p className="text-muted-foreground text-sm">
              Crie métricas específicas para seu método de avaliação.
            </p>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            size="sm"
            className="bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova Métrica
          </Button>
        </div>

        {customMetrics.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma métrica personalizada criada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customMetrics.map((m) => (
              <MetricRow
                key={m.key}
                metric={m}
                onUpdate={(changes) => updateMetric(m.key, changes)}
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
        }}
        displayOrder={metrics.length}
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

  return (
    <div
      className={`bg-card border rounded-xl p-4 transition-opacity ${
        metric.isEnabled ? "border-border" : "border-border opacity-50"
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Toggle */}
        <button
          onClick={() => onUpdate({ isEnabled: !metric.isEnabled })}
          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
            metric.isEnabled ? "bg-brand-blue-mid" : "bg-secondary"
          }`}
          title={metric.isEnabled ? "Desabilitar" : "Habilitar"}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              metric.isEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>

        {/* Label */}
        <div className="flex-1 min-w-[120px]">
          <Input
            value={metric.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            onBlur={() => {}}
            className="bg-secondary border-border text-foreground h-8 text-sm focus:border-brand-blue-light"
          />
        </div>

        {/* Unit */}
        <div className="w-16">
          <Input
            value={metric.unit}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            placeholder="un."
            className="bg-secondary border-border text-foreground h-8 text-sm placeholder:text-muted-foreground focus:border-brand-blue-light"
          />
        </div>

        {/* Benchmarks */}
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
                className="bg-secondary border-border text-foreground h-8 text-xs placeholder:text-muted-foreground/40 focus:border-brand-blue-light"
                title={["Recreativo", "Treinado", "Elite"][i]}
              />
            </div>
          ))}
        </div>

        {/* Weight */}
        <div className="w-24">
          <select
            value={String(metric.weight)}
            onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
            className="w-full h-8 bg-secondary border border-border text-foreground rounded-md px-2 text-xs focus:outline-none focus:border-brand-blue-light cursor-pointer"
            title="Peso no score geral"
          >
            {WEIGHT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v === "0" ? "0× off" : v === "1" ? "1× normal" : `${v}×`}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          {onReset && (
            <button
              onClick={onReset}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-pointer transition-colors"
              title="Redefinir para padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
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
