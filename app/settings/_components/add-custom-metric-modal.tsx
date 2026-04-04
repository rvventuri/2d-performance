"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MetricConfig } from "@/lib/types";
import { createCustomMetric } from "../_actions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (metric: MetricConfig) => void;
  displayOrder: number;
}

export function AddCustomMetricModal({ open, onClose, onCreated, displayOrder }: Props) {
  const [form, setForm] = useState({
    label: "",
    unit: "",
    higherIsBetter: true,
    benchRecreational: "",
    benchTrained: "",
    benchElite: "",
    weight: "1",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) {
      toast.error("Nome da métrica é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const result = await createCustomMetric({
        label: form.label.trim(),
        unit: form.unit.trim(),
        higherIsBetter: form.higherIsBetter,
        benchRecreational: form.benchRecreational ? Number(form.benchRecreational) : null,
        benchTrained: form.benchTrained ? Number(form.benchTrained) : null,
        benchElite: form.benchElite ? Number(form.benchElite) : null,
        weight: Number(form.weight),
        displayOrder,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success(`Métrica "${form.label}" criada com sucesso!`);
      onCreated(result.metric);
      onClose();
      setForm({ label: "", unit: "", higherIsBetter: true, benchRecreational: "", benchTrained: "", benchElite: "", weight: "1" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar métrica");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-heading tracking-wide">NOVA MÉTRICA</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nome *</Label>
            <Input
              placeholder="Ex: Triplo Salto"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-primary-bright h-10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Unidade</Label>
              <Input
                placeholder="cm, ms, kg..."
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-primary-bright h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Direção</Label>
              <select
                value={form.higherIsBetter ? "higher" : "lower"}
                onChange={(e) => setForm({ ...form, higherIsBetter: e.target.value === "higher" })}
                className="w-full h-10 bg-secondary border border-border text-foreground rounded-md px-3 text-sm focus:outline-none focus:border-brand-primary-bright"
              >
                <option value="higher">Maior = Melhor</option>
                <option value="lower">Menor = Melhor</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Benchmarks de referência</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["benchRecreational", "benchTrained", "benchElite"] as const).map((key, i) => (
                <div key={key} className="space-y-1">
                  <span className="text-muted-foreground text-xs">{["Recreativo", "Treinado", "Elite"][i]}</span>
                  <Input
                    type="number"
                    step="any"
                    placeholder="—"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-primary-bright h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Peso no Score Geral</Label>
            <select
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="w-full h-10 bg-secondary border border-border text-foreground rounded-md px-3 text-sm focus:outline-none focus:border-brand-primary-bright"
            >
              {["0", "0.5", "1", "1.5", "2", "2.5", "3"].map((v) => (
                <option key={v} value={v}>
                  {v === "0" ? "0× (não conta)" : v === "1" ? "1× (normal)" : `${v}×`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-bold cursor-pointer flex-1 h-10"
            >
              {saving ? "Criando..." : "Criar Métrica"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-10"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
