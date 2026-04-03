"use client";

import { useEffect, useState, useRef } from "react";
import {
  Database, BarChart2, Target, TrendingUp, Shield, Zap, Sparkles,
} from "lucide-react";

// ─── Stage definitions ────────────────────────────────────────────────────────

const STAGES = [
  {
    icon: Database,
    label: "Carregando histórico de avaliações",
    detail: "Buscando dados e métricas do atleta",
    startAt: 0,
  },
  {
    icon: BarChart2,
    label: "Analisando métricas de performance",
    detail: "Calculando scores e percentis de cada salto",
    startAt: 4,
  },
  {
    icon: Target,
    label: "Comparando com benchmarks",
    detail: "Posicionando o atleta na curva de referência internacional",
    startAt: 10,
  },
  {
    icon: TrendingUp,
    label: "Avaliando evolução temporal",
    detail: "Identificando tendências entre avaliações",
    startAt: 18,
  },
  {
    icon: Shield,
    label: "Identificando pontos fortes e alertas",
    detail: "Detectando assimetrias e riscos de lesão",
    startAt: 27,
  },
  {
    icon: Zap,
    label: "Formulando prescrições de treino",
    detail: "Adaptando protocolos ao objetivo e perfil do atleta",
    startAt: 36,
  },
  {
    icon: Sparkles,
    label: "Finalizando análise",
    detail: "Revisando coerência e montando o relatório final",
    startAt: 46,
  },
] as const;

const TOTAL_ESTIMATED = 60; // seconds, used to fill the progress bar

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** 'background' = analysis running server-side (no stream); 'streaming' = SSE active */
  mode: "background" | "streaming";
  /** Accumulated raw text from Claude (streaming mode only) */
  streamText?: string;
  /** ISO string when the analysis started — drives elapsed timer */
  startedAt?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalysisLoading({ mode, streamText = "", startedAt }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [prevStage, setPrevStage] = useState(-1);
  const consoleRef = useRef<HTMLDivElement>(null);

  const startRef = useRef<number>(
    startedAt ? new Date(startedAt).getTime() : Date.now()
  );

  // Timer — ticks every second
  useEffect(() => {
    const tick = () => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(secs);

      // Advance stage based on elapsed time
      let next = 0;
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (secs >= STAGES[i].startAt) { next = i; break; }
      }
      setActiveStage((prev) => {
        if (next !== prev) setPrevStage(prev);
        return next;
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [streamText]);

  const progress = Math.min((elapsed / TOTAL_ESTIMATED) * 100, 96);
  const stage = STAGES[activeStage];
  const Icon = stage.icon;

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m${s % 60}s`;
  };

  return (
    <div className="space-y-5">
      {/* ── Hero card ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-0.5 bg-secondary">
          <div
            className="h-full bg-gradient-to-r from-brand-blue-dark via-brand-blue-mid to-brand-blue-light transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-blue-dark to-brand-blue-light rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">
                  {mode === "background" ? "Análise em andamento" : "Gerando análise com IA"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {mode === "background"
                    ? "Iniciada automaticamente ao registrar a avaliação"
                    : "Conectado ao Claude · processando em tempo real"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground/60 text-xs tabular-nums">
              <span>{formatTime(elapsed)}</span>
            </div>
          </div>

          {/* Active stage */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue-mid/15 border border-brand-blue-light/20 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-6 h-6 text-brand-blue-light animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-base leading-tight mb-1">
                {stage.label}
                <span className="inline-flex gap-0.5 ml-2 relative top-[-1px]">
                  <span className="w-1 h-1 rounded-full bg-brand-blue-light animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-brand-blue-light animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-brand-blue-light animate-bounce [animation-delay:300ms]" />
                </span>
              </p>
              <p className="text-muted-foreground text-sm">{stage.detail}</p>
            </div>
          </div>

          {/* Stage pipeline */}
          <div className="grid grid-cols-7 gap-1">
            {STAGES.map((s, i) => {
              const StageIcon = s.icon;
              const isDone = i < activeStage;
              const isActive = i === activeStage;
              const isPending = i > activeStage;

              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isDone
                        ? "bg-brand-blue-mid/20 border border-brand-blue-light/30"
                        : isActive
                        ? "bg-brand-blue-mid/25 border border-brand-blue-light/50 scale-110"
                        : "bg-secondary border border-border/50"
                    }`}
                  >
                    <StageIcon
                      className={`w-3.5 h-3.5 transition-colors duration-500 ${
                        isDone
                          ? "text-brand-blue-light"
                          : isActive
                          ? "text-brand-blue-light"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </div>
                  {/* Connector line between stages */}
                  {i < STAGES.length - 1 && (
                    <div
                      className={`hidden sm:block absolute`}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`h-0.5 w-full rounded-full transition-all duration-700 ${
                      isDone ? "bg-brand-blue-light/50" : isActive ? "bg-brand-blue-light/30" : "bg-border/40"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Console panel (streaming mode only) ── */}
      {mode === "streaming" && streamText && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/40">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
            </div>
            <span className="text-muted-foreground/60 text-[11px] font-mono ml-1">
              claude-sonnet · output stream
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-light animate-pulse" />
              <span className="text-muted-foreground/50 text-[10px]">live</span>
            </div>
          </div>
          <div
            ref={consoleRef}
            className="p-4 font-mono text-[11px] leading-relaxed text-muted-foreground/70 max-h-52 overflow-y-auto scroll-smooth"
            style={{ wordBreak: "break-all" }}
          >
            <span>{streamText}</span>
            <span className="inline-block w-2 h-3.5 bg-brand-blue-light/80 ml-0.5 animate-pulse align-text-bottom" />
          </div>
        </div>
      )}

      {/* ── Skeleton cards ── */}
      <div className="animate-pulse space-y-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-secondary" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-secondary rounded w-1/3" />
              <div className="h-6 bg-secondary rounded w-1/2" />
              <div className="h-3 bg-secondary rounded w-full" />
              <div className="h-3 bg-secondary rounded w-3/4" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-40">
              <div className="h-3 bg-secondary rounded w-2/3 mb-3" />
              <div className="h-7 bg-secondary rounded w-1/2 mb-4" />
              <div className="h-2 bg-secondary rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
