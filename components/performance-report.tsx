"use client";

import { Assessment, Student, Metrics, METRIC_LABELS, METRIC_UNITS } from "@/lib/types";
import { analyzeAssessment, calcEvolution } from "@/lib/analysis";
import { formatDate } from "@/lib/utils";
import { APP_NAME } from "@/lib/branding";
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
      <div className="text-center py-12 text-muted-foreground text-sm">
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
          <h2 className="font-heading text-2xl font-bold text-foreground">
            RELATÓRIO DE PERFORMANCE
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Avaliação de {formatDate(latest.date)}
            {previous && ` • Comparativo com ${formatDate(previous.date)}`}
          </p>
        </div>
        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          className="border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer hidden sm:flex"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Athlete summary */}
      <div className="bg-secondary border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Perfil do Atleta
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Nome</p>
            <p className="text-foreground font-semibold">{student.name}</p>
          </div>
          {student.age > 0 && (
            <div>
              <p className="text-muted-foreground text-xs">Idade</p>
              <p className="text-foreground font-semibold">{student.age} anos</p>
            </div>
          )}
          {student.weight > 0 && (
            <div>
              <p className="text-muted-foreground text-xs">Peso</p>
              <p className="text-foreground font-semibold">{student.weight} kg</p>
            </div>
          )}
          {student.height > 0 && (
            <div>
              <p className="text-muted-foreground text-xs">Altura</p>
              <p className="text-foreground font-semibold">{student.height} cm</p>
            </div>
          )}
        </div>
        {student.objective && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-muted-foreground text-xs">Objetivo</p>
            <p className="text-foreground/80 text-sm mt-0.5">{student.objective}</p>
          </div>
        )}
      </div>

      {/* Current metrics */}
      <div className="bg-secondary border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
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
                <div key={key} className="bg-card rounded-lg p-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                    {METRIC_LABELS[key]}
                  </p>
                  <div className="flex items-end justify-between">
                    <span className="font-heading text-xl font-bold text-foreground">
                      {(latest.metrics[key] as number).toFixed(key === "rsi" ? 2 : 1)}
                      {unit && <span className="text-muted-foreground text-sm ml-1">{unit}</span>}
                    </span>
                    {pct !== null && (
                      <Badge
                        className={`text-xs border-0 ${
                          pct > 0
                            ? "bg-brand-primary/15 text-brand-primary-bright"
                            : pct < -2
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted-foreground/10 text-muted-foreground"
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
            <div className="bg-brand-primary/10 border border-brand-primary-bright/25 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-brand-accent" />
                <h3 className="font-heading text-sm font-bold text-brand-primary-bright uppercase tracking-wider">
                  Pontos Positivos
                </h3>
              </div>
              <ul className="space-y-2">
                {improvements.map((ev) => (
                  <li key={ev.key} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/80">{METRIC_LABELS[ev.key as keyof Metrics]}</span>
                    <span className="text-brand-accent-glow font-semibold">
                      +{ev.changePercent?.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {regressions.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <h3 className="font-heading text-sm font-bold text-destructive uppercase tracking-wider">
                  Pontos de Atenção
                </h3>
              </div>
              <ul className="space-y-2">
                {regressions.map((ev) => (
                  <li key={ev.key} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/80">{METRIC_LABELS[ev.key as keyof Metrics]}</span>
                    <span className="text-destructive font-semibold">
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
      <div className="bg-secondary border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
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
                    ? "bg-destructive/5 border border-destructive/20"
                    : isSuccess
                    ? "bg-brand-primary/10 border border-brand-primary-bright/25"
                    : "bg-brand-primary/10 border border-brand-primary-bright/25"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isWarning ? "text-destructive" : "text-brand-accent"
                    }`}
                  />
                )}
                <div>
                  <p
                    className={`font-semibold text-sm mb-0.5 ${
                      isWarning
                        ? "text-destructive"
                        : isSuccess
                        ? "text-brand-accent-glow"
                        : "text-brand-primary-bright"
                    }`}
                  >
                    {insight.title}
                  </p>
                  <p className="text-foreground/80 text-sm leading-relaxed">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-secondary border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Recomendações
        </h3>
        <div className="space-y-2">
          {warnings.length === 0 && positives.length > 0 && (
            <p className="text-foreground/80 text-sm leading-relaxed">
              O atleta apresenta boa resposta ao treinamento. Mantenha o protocolo atual e monitore as métricas a cada 4–6 semanas.
            </p>
          )}
          {warnings.some((w) => w.title.includes("Assimetria")) && (
            <div className="flex gap-2 text-sm text-foreground/80">
              <span className="text-brand-primary-bright font-bold shrink-0">→</span>
              Incluir exercícios unilaterais (lunges, step-up, single-leg RDL) para reduzir a assimetria. Reavalie em 3–4 semanas.
            </div>
          )}
          {insights.some((i) => i.title.includes("Ciclo Elástico Neutro") || i.title.includes("Déficit")) && (
            <div className="flex gap-2 text-sm text-foreground/80">
              <span className="text-brand-primary-bright font-bold shrink-0">→</span>
              Treinos de pliometria progressiva (skipping, salto em caixas, bounding) para melhorar a utilização do ciclo SSC.
            </div>
          )}
          {insights.some((i) => i.title.includes("Baixa Reatividade")) && (
            <div className="flex gap-2 text-sm text-foreground/80">
              <span className="text-brand-primary-bright font-bold shrink-0">→</span>
              Exercícios de baixo drop jump (20–30cm) com foco em minimizar tempo de contato. Progrida a altura conforme melhora do RSI.
            </div>
          )}
          {insights.some((i) => i.title.includes("Tempo de Contato Elevado")) && (
            <div className="flex gap-2 text-sm text-foreground/80">
              <span className="text-brand-primary-bright font-bold shrink-0">→</span>
              Treinar resposta neural rápida com exercícios de sprint, skips e rebotes rápidos com banda de resistência.
            </div>
          )}
          {warnings.length === 0 && positives.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Adicione mais dados de avaliação para gerar recomendações personalizadas.
            </p>
          )}
        </div>
      </div>

      <p className="text-muted-foreground/50 text-xs text-center">
        Relatório gerado por {APP_NAME} • {formatDate(new Date().toISOString())} • Total de {assessments.length} {assessments.length === 1 ? "avaliação" : "avaliações"}
      </p>
    </div>
  );
}
