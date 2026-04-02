"use client";

import { Assessment, Student, Metrics, METRIC_LABELS, METRIC_UNITS } from "@/lib/types";
import { analyzeAssessment, calcEvolution } from "@/lib/analysis";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Printer } from "lucide-react";

interface PerformanceReportProps {
  student: Student;
  assessments: Assessment[];
}

export default function PerformanceReport({ student, assessments }: PerformanceReportProps) {
  if (assessments.length === 0) {
    return (
      <div className="text-center py-12 text-[#475569] text-sm">
        Nenhuma avaliação registrada para gerar relatório.
      </div>
    );
  }

  const latest = assessments[assessments.length - 1];
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : undefined;
  const insights = analyzeAssessment(latest, previous);
  const evolutions = previous ? calcEvolution(latest, previous) : [];

  const positives = insights.filter((i) => i.type === "success");
  const warnings = insights.filter((i) => i.type === "warning");
  const infos = insights.filter((i) => i.type === "info");

  const improvements = evolutions.filter(
    (e) => e.changePercent !== null && e.changePercent > 0
  );
  const regressions = evolutions.filter(
    (e) => e.changePercent !== null && e.changePercent < -2
  );

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">
            RELATÓRIO DE PERFORMANCE
          </h2>
          <p className="text-[#94A3B8] text-sm mt-1">
            Avaliação de {formatDate(latest.date)}
            {previous && ` • Comparativo com ${formatDate(previous.date)}`}
          </p>
        </div>
        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          className="border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer hidden sm:flex"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Athlete summary */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
          Perfil do Atleta
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[#475569] text-xs">Nome</p>
            <p className="text-white font-semibold">{student.name}</p>
          </div>
          {student.age > 0 && (
            <div>
              <p className="text-[#475569] text-xs">Idade</p>
              <p className="text-white font-semibold">{student.age} anos</p>
            </div>
          )}
          {student.weight > 0 && (
            <div>
              <p className="text-[#475569] text-xs">Peso</p>
              <p className="text-white font-semibold">{student.weight} kg</p>
            </div>
          )}
          {student.height > 0 && (
            <div>
              <p className="text-[#475569] text-xs">Altura</p>
              <p className="text-white font-semibold">{student.height} cm</p>
            </div>
          )}
        </div>
        {student.objective && (
          <div className="mt-3 pt-3 border-t border-[#1E293B]">
            <p className="text-[#475569] text-xs">Objetivo</p>
            <p className="text-[#CBD5E1] text-sm mt-0.5">{student.objective}</p>
          </div>
        )}
      </div>

      {/* Current metrics */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">
          Resultados da Avaliação
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(latest.metrics) as (keyof Metrics)[])
            .filter((k) => latest.metrics[k] !== null)
            .map((key) => {
              const ev = evolutions.find((e) => e.key === key);
              const pct = ev?.changePercent ?? null;
              const unit = METRIC_UNITS[key];
              return (
                <div key={key} className="bg-[#1E293B] rounded-lg p-3">
                  <p className="text-[#475569] text-xs uppercase tracking-wider mb-1">
                    {METRIC_LABELS[key]}
                  </p>
                  <div className="flex items-end justify-between">
                    <span className="font-heading text-xl font-bold text-white">
                      {(latest.metrics[key] as number).toFixed(key === "rsi" ? 2 : 1)}
                      {unit && <span className="text-[#475569] text-sm ml-1">{unit}</span>}
                    </span>
                    {pct !== null && (
                      <Badge
                        className={`text-xs border-0 ${
                          pct > 0
                            ? "bg-[#22C55E]/10 text-[#22C55E]"
                            : pct < -2
                            ? "bg-[#EF4444]/10 text-[#EF4444]"
                            : "bg-[#94A3B8]/10 text-[#94A3B8]"
                        }`}
                      >
                        {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Evolution summary */}
      {evolutions.length > 0 && (improvements.length > 0 || regressions.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {improvements.length > 0 && (
            <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                <h3 className="font-heading text-sm font-bold text-[#22C55E] uppercase tracking-wider">
                  Pontos Positivos
                </h3>
              </div>
              <ul className="space-y-2">
                {improvements.map((ev) => (
                  <li key={ev.key} className="flex items-center justify-between text-sm">
                    <span className="text-[#CBD5E1]">{METRIC_LABELS[ev.key as keyof Metrics]}</span>
                    <span className="text-[#22C55E] font-semibold">
                      +{ev.changePercent?.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {regressions.length > 0 && (
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-[#EF4444]" />
                <h3 className="font-heading text-sm font-bold text-[#EF4444] uppercase tracking-wider">
                  Pontos de Atenção
                </h3>
              </div>
              <ul className="space-y-2">
                {regressions.map((ev) => (
                  <li key={ev.key} className="flex items-center justify-between text-sm">
                    <span className="text-[#CBD5E1]">{METRIC_LABELS[ev.key as keyof Metrics]}</span>
                    <span className="text-[#EF4444] font-semibold">
                      {ev.changePercent?.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Automated analysis */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">
          Análise Automática
        </h3>
        <div className="space-y-3">
          {[...warnings, ...positives, ...infos].map((insight, i) => {
            const isWarning = insight.type === "warning";
            const isSuccess = insight.type === "success";
            const Icon = isWarning ? AlertTriangle : isSuccess ? CheckCircle : null;
            return (
              <div
                key={i}
                className={`flex gap-3 p-3 rounded-lg ${
                  isWarning
                    ? "bg-[#EF4444]/5 border border-[#EF4444]/20"
                    : isSuccess
                    ? "bg-[#22C55E]/5 border border-[#22C55E]/20"
                    : "bg-[#3B82F6]/5 border border-[#3B82F6]/20"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isWarning ? "text-[#EF4444]" : "text-[#22C55E]"
                    }`}
                  />
                )}
                <div>
                  <p
                    className={`font-semibold text-sm mb-0.5 ${
                      isWarning
                        ? "text-[#FCA5A5]"
                        : isSuccess
                        ? "text-[#86EFAC]"
                        : "text-[#93C5FD]"
                    }`}
                  >
                    {insight.title}
                  </p>
                  <p className="text-[#CBD5E1] text-sm leading-relaxed">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">
          Recomendações
        </h3>
        <div className="space-y-2">
          {warnings.length === 0 && positives.length > 0 && (
            <p className="text-[#CBD5E1] text-sm leading-relaxed">
              O atleta apresenta boa resposta ao treinamento. Mantenha o protocolo atual e monitore as métricas a cada 4–6 semanas.
            </p>
          )}
          {warnings.some((w) => w.title.includes("Assimetria")) && (
            <div className="flex gap-2 text-sm text-[#CBD5E1]">
              <span className="text-[#22C55E] font-bold shrink-0">→</span>
              Incluir exercícios unilaterais (lunges, step-up, single-leg RDL) para reduzir a assimetria. Reavalie em 3–4 semanas.
            </div>
          )}
          {insights.some((i) => i.title.includes("Ciclo Elástico Neutro") || i.title.includes("Déficit")) && (
            <div className="flex gap-2 text-sm text-[#CBD5E1]">
              <span className="text-[#22C55E] font-bold shrink-0">→</span>
              Treinos de pliometria progressiva (skipping, salto em caixas, bounding) para melhorar a utilização do ciclo SSC.
            </div>
          )}
          {insights.some((i) => i.title.includes("Baixa Reatividade")) && (
            <div className="flex gap-2 text-sm text-[#CBD5E1]">
              <span className="text-[#22C55E] font-bold shrink-0">→</span>
              Exercícios de baixo drop jump (20–30cm) com foco em minimizar tempo de contato. Progrida a altura conforme melhora do RSI.
            </div>
          )}
          {insights.some((i) => i.title.includes("Tempo de Contato Elevado")) && (
            <div className="flex gap-2 text-sm text-[#CBD5E1]">
              <span className="text-[#22C55E] font-bold shrink-0">→</span>
              Treinar resposta neural rápida com exercícios de sprint, skips e rebotes rápidos com banda de resistência.
            </div>
          )}
          {warnings.length === 0 && positives.length === 0 && (
            <p className="text-[#475569] text-sm">
              Adicione mais dados de avaliação para gerar recomendações personalizadas.
            </p>
          )}
        </div>
      </div>

      <p className="text-[#334155] text-xs text-center">
        Relatório gerado por 2D Performance • {formatDate(new Date().toISOString())} • Total de {assessments.length} {assessments.length === 1 ? "avaliação" : "avaliações"}
      </p>
    </div>
  );
}
