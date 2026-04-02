"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getStudent, createAssessment } from "@/lib/storage";
import { Student, Metrics, METRIC_LABELS, METRIC_UNITS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ClipboardPlus, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

const METRIC_GROUPS = [
  {
    title: "Saltos Bilaterais",
    description: "Métricas de salto vertical bilateral",
    color: "#22C55E",
    fields: ["cmj", "sj", "abalakov"] as (keyof Metrics)[],
  },
  {
    title: "Reatividade",
    description: "Drop Jump e capacidade reativa",
    color: "#3B82F6",
    fields: ["rsi", "tempoContato", "alturaSaltoDJ"] as (keyof Metrics)[],
  },
  {
    title: "Assimetria",
    description: "Comparativo entre membros",
    color: "#F59E0B",
    fields: ["cmjEsquerdo", "cmjDireito", "assimetriaPercentual"] as (keyof Metrics)[],
  },
  {
    title: "Salto Horizontal",
    description: "Potência em extensão horizontal",
    color: "#EC4899",
    fields: ["saltoHorizontal"] as (keyof Metrics)[],
  },
];

export default function NewAssessmentPage() {
  const router = useRouter();
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

  useEffect(() => {
    getStudent(id).then((s) => {
      if (!s) { router.push("/"); return; }
      setStudent(s);
    });
  }, [id, router]);

  const [saving, setSaving] = useState(false);

  const handleMetricChange = useCallback((field: keyof Metrics, value: string) => {
    setMetrics((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate asymmetry when either CMJ leg value changes
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    setSaving(true);
    try {
      await createAssessment({ studentId: id, date, metrics: parsedMetrics });
      toast.success("Avaliação registrada com sucesso!");
      router.push(`/students/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar avaliação");
      setSaving(false);
    }
  };

  if (!student) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#22C55E]" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href={`/students/${id}`}>
          <Button variant="ghost" size="sm" className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-bold text-white tracking-wide">NOVA AVALIAÇÃO</h1>
        <p className="text-[#94A3B8] text-sm mt-1">{student.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
          <div className="space-y-2 max-w-xs">
            <Label className="text-[#94A3B8] text-sm font-medium uppercase tracking-wider">
              Data da Avaliação
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#1E293B] border-[#1E293B] text-white focus:border-[#22C55E] h-11 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Metric groups */}
        {METRIC_GROUPS.map((group) => (
          <div
            key={group.title}
            className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5"
            style={{ borderLeftWidth: "3px", borderLeftColor: group.color }}
          >
            <div className="mb-4">
              <h3 className="font-heading text-lg font-bold text-white tracking-wide">{group.title}</h3>
              <p className="text-[#94A3B8] text-xs mt-0.5">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {group.fields.map((field) => {
                const isAutoCalc = field === "assimetriaPercentual" && metrics.cmjEsquerdo !== "" && metrics.cmjDireito !== "";
                return (
                  <div key={field} className="space-y-2">
                    <Label
                      htmlFor={field}
                      className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider flex items-center gap-1"
                    >
                      {METRIC_LABELS[field]}
                      {isAutoCalc && (
                        <span className="text-[#22C55E] text-xs normal-case font-normal">(auto)</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id={field}
                        type="number"
                        step="0.01"
                        placeholder="—"
                        value={metrics[field]}
                        onChange={(e) => handleMetricChange(field, e.target.value)}
                        readOnly={isAutoCalc}
                        className={`bg-[#1E293B] border-[#1E293B] text-white placeholder:text-[#334155] focus:border-[#22C55E] h-11 ${
                          METRIC_UNITS[field] ? "pr-12" : ""
                        } ${isAutoCalc ? "opacity-70 cursor-default" : ""}`}
                      />
                      {METRIC_UNITS[field] && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] text-xs">
                          {METRIC_UNITS[field]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 p-3 bg-[#0F172A] border border-[#1E293B]/50 rounded-lg">
          <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />
          <p className="text-[#94A3B8] text-xs">
            Campos não preenchidos serão ignorados na análise. A assimetria é calculada automaticamente a partir do CMJ esquerdo e direito.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-[#020617] font-bold cursor-pointer flex-1 h-12 text-base"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ClipboardPlus className="w-5 h-5 mr-2" />}
            {saving ? "Salvando..." : "Salvar Avaliação"}
          </Button>
          <Link href={`/students/${id}`}>
            <Button type="button" variant="outline" className="border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer h-12">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
