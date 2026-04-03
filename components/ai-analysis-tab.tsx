"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Student, Assessment, AiAnalysisData, AiMetricScore, MetricStatus } from "@/lib/types";
import { getAiAnalysis } from "@/lib/storage";
import AnalysisLoading from "@/components/analysis-loading";
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

type Status =
  | "loading-saved"
  | "background-pending"
  | "generating"
  | "done"
  | "error"
  | "no-assessments";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MetricStatus, { label: string; color: string; bg: string; border: string }> = {
  elite:      { label: "Elite",          color: "#93C5FD", bg: "#2E5BFF/10", border: "#2E5BFF/30" },
  advanced:   { label: "Avançado",       color: "#1437C9", bg: "#1437C9/10", border: "#1437C9/30" },
  good:       { label: "Bom",            color: "#2E5BFF", bg: "#2E5BFF/10", border: "#2E5BFF/30" },
  developing: { label: "Em Construção",  color: "#F59E0B", bg: "#F59E0B/10", border: "#F59E0B/30" },
  critical:   { label: "Crítico",        color: "#EF4444", bg: "#EF4444/10", border: "#EF4444/30" },
};

const PRIORITY_CONFIG = {
  high:   { label: "Alta",   color: "#EF4444", icon: "🔴" },
  medium: { label: "Média",  color: "#F59E0B", icon: "🟡" },
  low:    { label: "Baixa",  color: "#2E5BFF", icon: "🟢" },
};

// ─── Small components ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#2E5BFF" : score >= 60 ? "#1437C9" : score >= 40 ? "#3B82F6" : score >= 20 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
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
      <div className="relative h-2 bg-secondary rounded-full overflow-visible mb-3">
        {/* Gradient fill */}
        <div
          className="absolute h-full rounded-full"
          style={{
            background: "linear-gradient(to right, #0B1F66 0%, #1437C9 40%, #2E5BFF 72%, #FFD400 100%)",
            left: `${recPos}%`,
            right: `${100 - elPos}%`,
            opacity: 0.4,
          }}
        />
        {/* Benchmark ticks */}
        {[
          { pos: recPos, label: "Rec.", color: "#475569" },
          { pos: trPos,  label: "Trein.", color: "#1437C9" },
          { pos: elPos,  label: "Elite", color: "#FFD400" },
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
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <span className="text-muted-foreground text-xs uppercase tracking-wider">{metric.label}</span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
          style={{ color: cfg.color, borderColor: cfg.color + "40", backgroundColor: cfg.color + "15" }}
        >
          {cfg.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="font-heading text-2xl font-bold text-foreground">{metric.value}</span>
        <span className="text-muted-foreground text-sm">{metric.unit}</span>
        <span className="ml-auto font-heading text-lg font-bold" style={{ color: cfg.color }}>
          {metric.score}
          <span className="text-muted-foreground text-xs font-normal">/100</span>
        </span>
      </div>

      <BenchmarkBar metric={metric} />

      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
        <span>{metric.benchmarks.recreational}{metric.unit} rec.</span>
        <span className="text-brand-blue-light">{metric.benchmarks.trained}{metric.unit} trein.</span>
        <span className="text-brand-yellow">{metric.benchmarks.elite}{metric.unit} elite</span>
      </div>

      <p className="text-muted-foreground text-xs mt-2 leading-relaxed">{metric.interpretation}</p>
    </div>
  );
}

const CustomRadarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-secondary border border-border rounded-lg p-3 text-xs shadow-xl">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="text-foreground font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { student: Student; assessments: Assessment[] }

export default function AiAnalysisTab({ student, assessments }: Props) {
  const [status, setStatus]               = useState<Status>("loading-saved");
  const [data, setData]                   = useState<AiAnalysisData | null>(null);
  const [error, setError]                 = useState("");
  const [generatedAt, setGenAt]           = useState<string | null>(null);
  const [copied, setCopied]               = useState(false);
  const [streamText, setStreamText]       = useState("");
  const [generatingStartedAt, setGenStartedAt] = useState<string | null>(null);
  const abortRef                          = useRef<AbortController | null>(null);
  const latestAssessment                  = assessments.length > 0 ? assessments[assessments.length - 1] : null;

  const generate = useCallback(async () => {
    if (!latestAssessment) return;
    setData(null);
    setError("");
    setStreamText("");
    setGenStartedAt(new Date().toISOString());
    setStatus("generating");
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/analyze-athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, assessments, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Erro na análise. Tente novamente.");
        setStatus("error");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("Erro ao iniciar stream. Tente novamente.");
        setStatus("error");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on newlines; keep any incomplete line in the buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr) as {
              text?: string;
              done?: boolean;
              data?: AiAnalysisData;
              error?: string;
            };

            if (event.error) {
              setError(event.error);
              setStatus("error");
              return;
            }

            if (event.text) {
              setStreamText((prev) => prev + event.text);
            }

            if (event.done && event.data) {
              setData(event.data);
              setGenAt(new Date().toISOString());
              setStatus("done");
              return;
            }
          } catch {
            // Malformed SSE chunk — skip
          }
        }
      }

      // Stream ended without a done event — treat as error
      setError("Stream encerrado inesperadamente. Tente novamente.");
      setStatus("error");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Erro ao conectar com a API. Verifique sua ANTHROPIC_API_KEY.");
      setStatus("error");
    }
  }, [student, assessments, latestAssessment]);

  // Initial load: check DB for existing or in-progress analysis
  useEffect(() => {
    if (assessments.length === 0) { setStatus("no-assessments"); return; }

    let cancelled = false;
    (async () => {
      setStatus("loading-saved");
      try {
        const saved = await getAiAnalysis(student.id);
        if (cancelled) return;

        if (!saved) {
          // No analysis record at all — trigger one from the tab (legacy path)
          generate();
          return;
        }

        if (saved.status === "pending" || saved.status === "running") {
          // Background job is in progress — show loading and poll
          setStatus("background-pending");
          return;
        }

        if (saved.status === "done" && saved.lastAssessmentId === latestAssessment?.id) {
          // Analysis is current
          try {
            setData(JSON.parse(saved.content) as AiAnalysisData);
            setGenAt(saved.generatedAt);
            setStatus("done");
          } catch {
            generate();
          }
          return;
        }

        // Analysis is outdated or errored — re-generate from the tab
        generate();
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

  // Polling: when a background analysis is in progress, check every 3s
  useEffect(() => {
    if (status !== "background-pending") return;

    const interval = setInterval(async () => {
      try {
        const saved = await getAiAnalysis(student.id);

        if (!saved || saved.status === "error") {
          clearInterval(interval);
          setError("A análise em background falhou. Tente gerar novamente.");
          setStatus("error");
          return;
        }

        if (saved.status === "done") {
          clearInterval(interval);
          try {
            setData(JSON.parse(saved.content) as AiAnalysisData);
            setGenAt(saved.generatedAt);
            setStatus("done");
          } catch {
            setError("Erro ao processar resultado da análise. Tente novamente.");
            setStatus("error");
          }
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, student.id]);

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
      <div className="text-center py-16 bg-card border border-border rounded-xl">
        <Sparkles className="w-12 h-12 text-border mx-auto mb-4" />
        <h3 className="font-heading text-xl font-bold text-foreground mb-2">Nenhuma avaliação</h3>
        <p className="text-muted-foreground text-sm">Registre pelo menos uma avaliação para gerar a análise.</p>
      </div>
    );
  }

  // ── Loading-saved (very brief — just checking DB) ──
  if (status === "loading-saved") {
    return (
      <div className="flex items-center gap-3 py-10 justify-center">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-blue-dark to-brand-blue-light rounded-xl flex items-center justify-center animate-pulse">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <p className="text-muted-foreground text-sm">Carregando análise...</p>
      </div>
    );
  }

  // ── Background pending or streaming generate ──
  if (status === "generating" || status === "background-pending") {
    return (
      <AnalysisLoading
        mode={status === "background-pending" ? "background" : "streaming"}
        streamText={streamText}
        startedAt={generatingStartedAt ?? undefined}
      />
    );
  }

  // ── Error ──
  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center bg-card border border-border rounded-xl">
        <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <p className="text-foreground font-semibold mb-1">Erro na análise</p>
          <p className="text-muted-foreground text-sm max-w-md">{error}</p>
        </div>
        <Button onClick={handleRegenerate} className="bg-brand-blue-mid hover:bg-brand-blue-dark text-white cursor-pointer">
          <RefreshCw className="w-4 h-4 mr-2" />Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor =
    data.performanceScore >= 75 ? "#2E5BFF" :
    data.performanceScore >= 60 ? "#1437C9" :
    data.performanceScore >= 40 ? "#3B82F6" :
    data.performanceScore >= 20 ? "#F59E0B" : "#EF4444";

  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-brand-blue-dark to-brand-blue-light rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-muted-foreground text-xs">
            {generatedAt ? `Gerada em ${formatDate(generatedAt.split("T")[0])}` : "Análise IA"}
            {" · "}{assessments.length} {assessments.length === 1 ? "avaliação" : "avaliações"}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={handleCopy} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-7 w-7 p-0">
            {copied ? <Check className="w-3.5 h-3.5 text-brand-yellow" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button onClick={handleRegenerate} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-7 w-7 p-0">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Hero card: score + profile + summary ── */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">

          {/* Score ring */}
          <div className="relative shrink-0 flex flex-col items-center">
            <ScoreRing score={data.performanceScore} size={112} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-heading text-3xl font-bold" style={{ color: scoreColor }}>
                {data.performanceScore}
              </span>
              <span className="text-muted-foreground text-[10px] mt-0.5">/ 100</span>
            </div>
            <span className="text-muted-foreground text-xs mt-1">Escore Geral</span>
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
            <p className="text-foreground/80 text-sm leading-relaxed mb-4">{data.summary}</p>

            {/* Objective alignment */}
            {student.objective && (
              <div className="bg-secondary border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-brand-blue-light" />
                    <span className="text-brand-blue-light text-xs font-semibold">Alinhamento ao Objetivo</span>
                  </div>
                  <span className="font-heading font-bold text-sm" style={{ color: scoreColor }}>
                    {data.objectiveAlignment.score}%
                  </span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${data.objectiveAlignment.score}%`, backgroundColor: scoreColor }}
                  />
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{data.objectiveAlignment.keyGap}</p>
                {data.objectiveAlignment.timeline && (
                  <p className="text-muted-foreground/60 text-xs mt-1">
                    <span className="text-muted-foreground">Projeção:</span> {data.objectiveAlignment.timeline}
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
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Perfil Atlético
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={data.radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                tickCount={4}
              />
              <Tooltip content={<CustomRadarTooltip />} />
              <Radar
                name="Elite"
                dataKey="elite"
                stroke="#2E5BFF"
                fill="#2E5BFF"
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
          <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-px bg-brand-blue-light inline-block" style={{ borderTop: "1px dashed #2E5BFF" }} />
              Elite
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-px bg-brand-blue-light inline-block" />
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
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider flex-1">
                Evolução
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                data.evolution.trend === "improving" ? "bg-brand-blue-mid/15 text-brand-yellow-glow" :
                data.evolution.trend === "declining" ? "bg-destructive/10 text-destructive" :
                "bg-[#F59E0B]/10 text-[#F59E0B]"
              }`}>
                {data.evolution.trend === "improving" ? "↑ Progredindo" :
                 data.evolution.trend === "declining" ? "↓ Regredindo" : "→ Estável"}
              </span>
            </div>

            <div className="bg-secondary border border-border rounded-lg px-4 py-3 mb-4">
              <p className="text-foreground font-semibold text-sm">{data.evolution.highlight}</p>
              <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{data.evolution.details}</p>
            </div>

            <div className="space-y-2.5">
              {data.evolution.keyMetrics.map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    m.direction === "up" ? "bg-brand-blue-mid/15" :
                    m.direction === "down" ? "bg-destructive/10" : "bg-[#F59E0B]/10"
                  }`}>
                    {m.direction === "up" ? <TrendingUp className="w-4 h-4 text-brand-blue-light" /> :
                     m.direction === "down" ? <TrendingDown className="w-4 h-4 text-destructive" /> :
                     <Minus className="w-4 h-4 text-[#F59E0B]" />}
                  </div>
                  <span className="text-muted-foreground text-sm flex-1">{m.label}</span>
                  <span className={`font-heading font-bold text-sm ${
                    m.direction === "up" ? "text-brand-blue-light" :
                    m.direction === "down" ? "text-destructive" : "text-[#F59E0B]"
                  }`}>
                    {m.change > 0 ? "+" : ""}{m.change.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-8 h-8 text-border mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Primeira avaliação</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Evolução disponível após a 2ª avaliação</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Metric cards grid ── */}
      <div>
        <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
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
          <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-yellow" />Pontos Fortes
          </h3>
          <div className="space-y-2.5">
            {data.strengths.map((s, i) => (
              <div key={i} className="bg-card border border-brand-blue-light/25 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-brand-blue-mid/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-brand-yellow-glow" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-sm">{s.title}</p>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />Alertas
          </h3>
          <div className="space-y-2.5">
            {data.alerts.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-muted-foreground text-sm">Nenhum alerta crítico identificado.</p>
              </div>
            ) : data.alerts.map((a, i) => {
              const cfg = PRIORITY_CONFIG[a.priority];
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-4"
                  style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0">{cfg.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-foreground font-semibold text-sm">{a.title}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ color: cfg.color, backgroundColor: cfg.color + "20" }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{a.description}</p>
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
        <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-yellow" />Prescrição de Treino
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.prescriptions.map((p, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-heading font-bold text-sm"
                  style={{
                    backgroundColor: p.priority === 1 ? "#2E5BFF20" : p.priority === 2 ? "#1437C920" : "#FFD40020",
                    color: p.priority === 1 ? "#93C5FD" : p.priority === 2 ? "#60A5FA" : "#FFD400",
                  }}>
                  {p.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.quality}</span>
                  <p className="text-foreground font-semibold text-sm leading-tight">{p.title}</p>
                </div>
                {p.frequency && (
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0">
                    {p.frequency}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed mb-3">{p.rationale}</p>

              <div className="space-y-1.5">
                {p.examples.map((ex, j) => (
                  <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3 text-brand-blue-light shrink-0 mt-0.5" />
                    <span>{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <p className="text-muted-foreground/30 text-xs text-center pb-2">
        Análise gerada por IA (Claude Sonnet) — suporte à decisão, não diagnóstico definitivo · nova análise gerada automaticamente ao inserir avaliação
      </p>
    </div>
  );
}
