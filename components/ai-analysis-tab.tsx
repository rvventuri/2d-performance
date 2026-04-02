"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Student, Assessment, AiAnalysisData, AiMetricScore, MetricStatus } from "@/lib/types";
import { getAiAnalysis, saveAiAnalysis } from "@/lib/storage";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Sparkles, AlertTriangle, RefreshCw, Copy, Check,
  TrendingUp, TrendingDown, Minus, Target, Zap, Shield, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "loading-saved" | "generating" | "done" | "error" | "no-assessments";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MetricStatus, { label: string; color: string; bg: string; border: string }> = {
  elite:      { label: "Elite",          color: "#A78BFA", bg: "#7C3AED/10", border: "#7C3AED/30" },
  advanced:   { label: "Avançado",       color: "#22C55E", bg: "#22C55E/10", border: "#22C55E/30" },
  good:       { label: "Bom",            color: "#3B82F6", bg: "#3B82F6/10", border: "#3B82F6/30" },
  developing: { label: "Em Construção",  color: "#F59E0B", bg: "#F59E0B/10", border: "#F59E0B/30" },
  critical:   { label: "Crítico",        color: "#EF4444", bg: "#EF4444/10", border: "#EF4444/30" },
};

const PRIORITY_CONFIG = {
  high:   { label: "Alta",   color: "#EF4444", icon: "🔴" },
  medium: { label: "Média",  color: "#F59E0B", icon: "🟡" },
  low:    { label: "Baixa",  color: "#22C55E", icon: "🟢" },
};

// ─── Small components ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#A78BFA" : score >= 60 ? "#22C55E" : score >= 40 ? "#3B82F6" : score >= 20 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E293B" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

function BenchmarkBar({ metric }: { metric: AiMetricScore }) {
  const { value, benchmarks, higherIsBetter, status } = metric;
  const cfg = STATUS_CONFIG[status];

  // Normalize position on bar (0-100%)
  const min = higherIsBetter
    ? Math.min(benchmarks.recreational * 0.7, value * 0.85)
    : Math.min(benchmarks.elite * 0.7, value * 0.85);
  const max = higherIsBetter
    ? Math.max(benchmarks.elite * 1.15, value * 1.05)
    : Math.max(benchmarks.recreational * 1.2, value * 1.1);

  const toPos = (v: number) =>
    Math.max(2, Math.min(98, ((v - min) / (max - min)) * 100));

  const recPos  = toPos(benchmarks.recreational);
  const trPos   = toPos(benchmarks.trained);
  const elPos   = toPos(benchmarks.elite);
  const valPos  = toPos(value);

  return (
    <div className="mt-3">
      <div className="relative h-2 bg-[#1E293B] rounded-full overflow-visible mb-3">
        {/* Gradient fill */}
        <div
          className="absolute h-full rounded-full"
          style={{
            background: "linear-gradient(to right, #1E3A5F 0%, #1E40AF 33%, #15803D 66%, #7C3AED 100%)",
            left: `${recPos}%`,
            right: `${100 - elPos}%`,
            opacity: 0.4,
          }}
        />
        {/* Benchmark ticks */}
        {[
          { pos: recPos, label: "Rec.", color: "#475569" },
          { pos: trPos,  label: "Trein.", color: "#3B82F6" },
          { pos: elPos,  label: "Elite", color: "#7C3AED" },
        ].map(({ pos, label, color }) => (
          <div key={label} className="absolute flex flex-col items-center" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
            <div className="w-px h-3 mt-[-2px]" style={{ backgroundColor: color }} />
            <span className="text-[9px] mt-1 whitespace-nowrap" style={{ color }}>{label}</span>
          </div>
        ))}
        {/* Athlete marker */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg z-10"
          style={{
            left: `${valPos}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: cfg.color,
          }}
        />
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: AiMetricScore }) {
  const cfg = STATUS_CONFIG[metric.status];

  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[#94A3B8] text-xs uppercase tracking-wider">{metric.label}</span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
          style={{ color: cfg.color, borderColor: cfg.color + "40", backgroundColor: cfg.color + "15" }}
        >
          {cfg.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="font-heading text-2xl font-bold text-white">{metric.value}</span>
        <span className="text-[#475569] text-sm">{metric.unit}</span>
        <span className="ml-auto font-heading text-lg font-bold" style={{ color: cfg.color }}>
          {metric.score}
          <span className="text-[#475569] text-xs font-normal">/100</span>
        </span>
      </div>

      <BenchmarkBar metric={metric} />

      <div className="flex items-center justify-between text-[10px] text-[#475569] mt-1">
        <span>{metric.benchmarks.recreational}{metric.unit} rec.</span>
        <span className="text-[#3B82F6]">{metric.benchmarks.trained}{metric.unit} trein.</span>
        <span className="text-[#7C3AED]">{metric.benchmarks.elite}{metric.unit} elite</span>
      </div>

      <p className="text-[#64748B] text-xs mt-2 leading-relaxed">{metric.interpretation}</p>
    </div>
  );
}

const CustomRadarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 text-xs shadow-xl">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[#94A3B8]">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AnalysisSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-[#1E293B]" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-[#1E293B] rounded w-1/3" />
            <div className="h-6 bg-[#1E293B] rounded w-1/2" />
            <div className="h-3 bg-[#1E293B] rounded w-full" />
            <div className="h-3 bg-[#1E293B] rounded w-3/4" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 h-40">
            <div className="h-3 bg-[#1E293B] rounded w-2/3 mb-3" />
            <div className="h-7 bg-[#1E293B] rounded w-1/2 mb-4" />
            <div className="h-2 bg-[#1E293B] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { student: Student; assessments: Assessment[] }

export default function AiAnalysisTab({ student, assessments }: Props) {
  const [status, setStatus]       = useState<Status>("loading-saved");
  const [data, setData]           = useState<AiAnalysisData | null>(null);
  const [error, setError]         = useState("");
  const [generatedAt, setGenAt]   = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const abortRef                  = useRef<AbortController | null>(null);
  const latestAssessment          = assessments.length > 0 ? assessments[assessments.length - 1] : null;

  const generate = useCallback(async () => {
    if (!latestAssessment) return;
    setData(null);
    setError("");
    setStatus("generating");
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/analyze-athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, assessments }),
        signal: abortRef.current.signal,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json) {
        setError(json?.error || "Erro na análise. Tente novamente.");
        setStatus("error");
        return;
      }

      const analysisData: AiAnalysisData = json;

      setData(analysisData);

      try {
        await saveAiAnalysis(student.id, JSON.stringify(analysisData), latestAssessment.id);
        setGenAt(new Date().toISOString());
      } catch {
        toast.error("Análise gerada, mas não foi possível salvar no banco.");
      }

      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Erro ao conectar com a API. Verifique sua ANTHROPIC_API_KEY.");
      setStatus("error");
    }
  }, [student, assessments, latestAssessment]);

  useEffect(() => {
    if (assessments.length === 0) { setStatus("no-assessments"); return; }

    let cancelled = false;
    (async () => {
      setStatus("loading-saved");
      try {
        const saved = await getAiAnalysis(student.id);
        if (cancelled) return;
        const needsRegen = !saved || saved.lastAssessmentId !== latestAssessment?.id;
        if (needsRegen) {
          generate();
        } else {
          try {
            setData(JSON.parse(saved.content) as AiAnalysisData);
            setGenAt(saved.generatedAt);
            setStatus("done");
          } catch {
            generate();
          }
        }
      } catch {
        if (!cancelled) generate();
      }
    })();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, latestAssessment?.id]);

  const handleRegenerate = () => { abortRef.current?.abort(); generate(); };

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast.success("Dados copiados!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── No assessments ──
  if (status === "no-assessments") {
    return (
      <div className="text-center py-16 bg-[#0F172A] border border-[#1E293B] rounded-xl">
        <Sparkles className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
        <h3 className="font-heading text-xl font-bold text-white mb-2">Nenhuma avaliação</h3>
        <p className="text-[#94A3B8] text-sm">Registre pelo menos uma avaliação para gerar a análise.</p>
      </div>
    );
  }

  // ── Generating ──
  if (status === "loading-saved" || status === "generating") {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {status === "loading-saved" ? "Carregando análise..." : "Gerando análise com IA..."}
            </p>
            <p className="text-[#475569] text-xs">
              {status === "generating" ? "O preparador virtual está processando as métricas (~20s)" : "Buscando análise salva"}
            </p>
          </div>
        </div>
        <AnalysisSkeleton />
      </div>
    );
  }

  // ── Error ──
  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center bg-[#0F172A] border border-[#1E293B] rounded-xl">
        <div className="w-12 h-12 bg-[#EF4444]/10 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
        </div>
        <div>
          <p className="text-white font-semibold mb-1">Erro na análise</p>
          <p className="text-[#94A3B8] text-sm max-w-md">{error}</p>
        </div>
        <Button onClick={handleRegenerate} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white cursor-pointer">
          <RefreshCw className="w-4 h-4 mr-2" />Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor =
    data.performanceScore >= 75 ? "#A78BFA" :
    data.performanceScore >= 60 ? "#22C55E" :
    data.performanceScore >= 40 ? "#3B82F6" :
    data.performanceScore >= 20 ? "#F59E0B" : "#EF4444";

  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[#475569] text-xs">
            {generatedAt ? `Gerada em ${formatDate(generatedAt.split("T")[0])}` : "Análise IA"}
            {" · "}{assessments.length} {assessments.length === 1 ? "avaliação" : "avaliações"}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={handleCopy} variant="ghost" size="sm" className="text-[#475569] hover:text-[#94A3B8] hover:bg-[#1E293B] cursor-pointer h-7 w-7 p-0">
            {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button onClick={handleRegenerate} variant="ghost" size="sm" className="text-[#475569] hover:text-[#94A3B8] hover:bg-[#1E293B] cursor-pointer h-7 w-7 p-0">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Hero card: score + profile + summary ── */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">

          {/* Score ring */}
          <div className="relative shrink-0 flex flex-col items-center">
            <ScoreRing score={data.performanceScore} size={112} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-heading text-3xl font-bold" style={{ color: scoreColor }}>
                {data.performanceScore}
              </span>
              <span className="text-[#475569] text-[10px] mt-0.5">/ 100</span>
            </div>
            <span className="text-[#475569] text-xs mt-1">Escore Geral</span>
          </div>

          {/* Profile + summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full border"
                style={{ color: scoreColor, borderColor: scoreColor + "40", backgroundColor: scoreColor + "15" }}
              >
                {data.profileType}
              </span>
            </div>
            <p className="text-[#CBD5E1] text-sm leading-relaxed mb-4">{data.summary}</p>

            {/* Objective alignment */}
            {student.objective && (
              <div className="bg-[#0D1117] border border-[#1E293B] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span className="text-[#7C3AED] text-xs font-semibold">Alinhamento ao Objetivo</span>
                  </div>
                  <span className="font-heading font-bold text-sm" style={{ color: scoreColor }}>
                    {data.objectiveAlignment.score}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${data.objectiveAlignment.score}%`, backgroundColor: scoreColor }}
                  />
                </div>
                <p className="text-[#475569] text-xs leading-relaxed">{data.objectiveAlignment.keyGap}</p>
                {data.objectiveAlignment.timeline && (
                  <p className="text-[#334155] text-xs mt-1">
                    <span className="text-[#475569]">Projeção:</span> {data.objectiveAlignment.timeline}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Radar chart + Evolution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Radar */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
          <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">
            Perfil Atlético
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={data.radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#1E293B" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#64748B", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#334155", fontSize: 9 }}
                tickCount={4}
              />
              <Tooltip content={<CustomRadarTooltip />} />
              <Radar
                name="Elite"
                dataKey="elite"
                stroke="#7C3AED"
                fill="#7C3AED"
                fillOpacity={0.08}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
              <Radar
                name="Treinado"
                dataKey="trained"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.08}
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <Radar
                name="Atleta"
                dataKey="athlete"
                stroke={scoreColor}
                fill={scoreColor}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center text-xs text-[#475569] mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-px bg-[#7C3AED] inline-block" style={{ borderTop: "1px dashed #7C3AED" }} />
              Elite
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-px bg-[#3B82F6] inline-block" />
              Treinado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-px inline-block" style={{ backgroundColor: scoreColor }} />
              {student.name.split(" ")[0]}
            </span>
          </div>
        </div>

        {/* Evolution (if available) */}
        {data.evolution ? (
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider flex-1">
                Evolução
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                data.evolution.trend === "improving" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                data.evolution.trend === "declining" ? "bg-[#EF4444]/10 text-[#EF4444]" :
                "bg-[#F59E0B]/10 text-[#F59E0B]"
              }`}>
                {data.evolution.trend === "improving" ? "↑ Progredindo" :
                 data.evolution.trend === "declining" ? "↓ Regredindo" : "→ Estável"}
              </span>
            </div>

            <div className="bg-[#0D1117] border border-[#1E293B] rounded-lg px-4 py-3 mb-4">
              <p className="text-white font-semibold text-sm">{data.evolution.highlight}</p>
              <p className="text-[#64748B] text-xs mt-1 leading-relaxed">{data.evolution.details}</p>
            </div>

            <div className="space-y-2.5">
              {data.evolution.keyMetrics.map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    m.direction === "up" ? "bg-[#22C55E]/10" :
                    m.direction === "down" ? "bg-[#EF4444]/10" : "bg-[#F59E0B]/10"
                  }`}>
                    {m.direction === "up" ? <TrendingUp className="w-4 h-4 text-[#22C55E]" /> :
                     m.direction === "down" ? <TrendingDown className="w-4 h-4 text-[#EF4444]" /> :
                     <Minus className="w-4 h-4 text-[#F59E0B]" />}
                  </div>
                  <span className="text-[#94A3B8] text-sm flex-1">{m.label}</span>
                  <span className={`font-heading font-bold text-sm ${
                    m.direction === "up" ? "text-[#22C55E]" :
                    m.direction === "down" ? "text-[#EF4444]" : "text-[#F59E0B]"
                  }`}>
                    {m.change > 0 ? "+" : ""}{m.change.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-8 h-8 text-[#1E293B] mx-auto mb-2" />
              <p className="text-[#475569] text-sm">Primeira avaliação</p>
              <p className="text-[#334155] text-xs mt-1">Evolução disponível após a 2ª avaliação</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Metric cards grid ── */}
      <div>
        <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
          Métricas vs Benchmark
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.metricScores.map((m) => (
            <MetricCard key={m.key} metric={m} />
          ))}
        </div>
      </div>

      {/* ── Strengths & Alerts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Strengths */}
        <div>
          <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#22C55E]" />Pontos Fortes
          </h3>
          <div className="space-y-2.5">
            {data.strengths.map((s, i) => (
              <div key={i} className="bg-[#0F172A] border border-[#22C55E]/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#22C55E]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{s.title}</p>
                    <p className="text-[#64748B] text-xs mt-1 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />Alertas
          </h3>
          <div className="space-y-2.5">
            {data.alerts.length === 0 ? (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 text-center">
                <p className="text-[#475569] text-sm">Nenhum alerta crítico identificado.</p>
              </div>
            ) : data.alerts.map((a, i) => {
              const cfg = PRIORITY_CONFIG[a.priority];
              return (
                <div key={i} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4"
                  style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0">{cfg.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-semibold text-sm">{a.title}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ color: cfg.color, backgroundColor: cfg.color + "20" }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[#64748B] text-xs leading-relaxed">{a.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Prescriptions ── */}
      <div>
        <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#7C3AED]" />Prescrição de Treino
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.prescriptions.map((p, i) => (
            <div key={i} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-heading font-bold text-sm"
                  style={{
                    backgroundColor: p.priority === 1 ? "#7C3AED20" : p.priority === 2 ? "#3B82F620" : "#22C55E20",
                    color: p.priority === 1 ? "#A78BFA" : p.priority === 2 ? "#60A5FA" : "#4ADE80",
                  }}>
                  {p.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">{p.quality}</span>
                  <p className="text-white font-semibold text-sm leading-tight">{p.title}</p>
                </div>
                {p.frequency && (
                  <span className="text-[10px] text-[#475569] bg-[#1E293B] px-2 py-0.5 rounded-full shrink-0">
                    {p.frequency}
                  </span>
                )}
              </div>

              <p className="text-[#64748B] text-xs leading-relaxed mb-3">{p.rationale}</p>

              <div className="space-y-1.5">
                {p.examples.map((ex, j) => (
                  <div key={j} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                    <ChevronRight className="w-3 h-3 text-[#7C3AED] shrink-0 mt-0.5" />
                    <span>{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <p className="text-[#1E293B] text-xs text-center pb-2">
        Análise gerada por IA (Claude Sonnet) — suporte à decisão, não diagnóstico definitivo · nova análise gerada automaticamente ao inserir avaliação
      </p>
    </div>
  );
}
