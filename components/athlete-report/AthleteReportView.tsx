"use client";

import { forwardRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import MetricChart from "@/components/metric-chart";
import { Assessment, AiAnalysisData, METRIC_LABELS, Student } from "@/lib/types";
import { ShareBrand } from "./ShareBrand";
import { AssessmentCard } from "./AssessmentCard";
import { CHART_COLORS, CUSTOM_METRIC_COLOR } from "./chart-colors";

const STANDARD_METRICS = Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[];

export interface AthleteReportViewProps {
  student: Pick<Student, "name" | "age" | "weight" | "height" | "objective" | "photoUrl">;
  assessments: Assessment[];
  aiAnalysis?: AiAnalysisData | null;
  customMetricLabels?: Record<string, string>;
  mode?: "screen" | "export";
}

const AthleteReportView = forwardRef<HTMLDivElement, AthleteReportViewProps>(function AthleteReportView(
  { student, assessments, aiAnalysis = null, customMetricLabels = {}, mode = "screen" },
  ref
) {
  const isExport = mode === "export";
  const animate = !isExport;

  const activeMetrics = STANDARD_METRICS.filter((key) =>
    assessments.some((a) => a.metrics[key] !== null && a.metrics[key] !== undefined)
  );

  const customMetricKeys = Array.from(
    new Set(assessments.flatMap((a) => Object.keys(a.customMetrics ?? {})))
  ).filter((k) => assessments.some((a) => (a.customMetrics?.[k] ?? null) !== null));

  const bmi =
    student.weight && student.height
      ? (student.weight / Math.pow(student.height / 100, 2)).toFixed(1)
      : null;

  const evolutionTrendIcon =
    aiAnalysis?.evolution?.trend === "improving" ? (
      <TrendingUp className="w-4 h-4 text-[#22C55E]" />
    ) : aiAnalysis?.evolution?.trend === "declining" ? (
      <TrendingDown className="w-4 h-4 text-[#EF4444]" />
    ) : (
      <Minus className="w-4 h-4 text-[#F59E0B]" />
    );

  return (
    <div
      ref={ref}
      className={`bg-background text-foreground ${isExport ? "w-[800px]" : "min-h-screen"}`}
    >
      {!isExport && (
        <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <ShareBrand
                showAppNameFallback
                textClassName="font-heading font-bold text-sm text-foreground group-hover:text-brand-primary-bright transition-colors"
              />
            </Link>
            <span className="text-muted-foreground text-xs hidden sm:block">Relatório do Atleta</span>
          </div>
        </nav>
      )}

      {isExport && (
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-border">
          <ShareBrand showAppNameFallback />
          <span className="text-muted-foreground text-xs">Relatório do Atleta</span>
        </div>
      )}

      <div
        className={`max-w-3xl mx-auto px-4 py-8 space-y-10 ${isExport ? "px-8" : ""}`}
      >
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0">
            {student.photoUrl ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-brand-primary ring-4 ring-brand-primary/10">
                <Image
                  src={student.photoUrl}
                  alt={student.name}
                  fill
                  className="object-cover"
                  crossOrigin="anonymous"
                  unoptimized={isExport}
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-bright flex items-center justify-center border-2 border-brand-primary ring-4 ring-brand-primary/10">
                <span className="text-3xl font-bold text-primary-foreground font-heading">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-3 flex-1">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">{student.name}</h1>
              {student.objective && (
                <p className="text-brand-primary-bright text-sm mt-1">{student.objective}</p>
              )}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs">
              {student.age > 0 && (
                <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  {student.age} anos
                </span>
              )}
              {student.weight > 0 && (
                <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  {student.weight} kg
                </span>
              )}
              {student.height > 0 && (
                <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  {student.height} cm
                </span>
              )}
              {bmi && (
                <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                  IMC {bmi}
                </span>
              )}
              <span className="bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground">
                {assessments.length} avaliação{assessments.length !== 1 ? "ões" : ""}
              </span>
            </div>
          </div>
        </section>

        {aiAnalysis?.evolution && (
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              {evolutionTrendIcon}
              Sua evolução
            </h2>
            <p className="text-foreground font-medium">{aiAnalysis.evolution.highlight}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {aiAnalysis.evolution.details}
            </p>
            {aiAnalysis.evolution.keyMetrics?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {aiAnalysis.evolution.keyMetrics.map((km) => (
                  <div
                    key={km.label}
                    className="flex items-center gap-1.5 bg-secondary rounded-lg px-3 py-1.5 text-xs"
                  >
                    {km.direction === "up" && <TrendingUp className="w-3 h-3 text-[#22C55E]" />}
                    {km.direction === "down" && (
                      <TrendingDown className="w-3 h-3 text-destructive" />
                    )}
                    {km.direction === "flat" && <Minus className="w-3 h-3 text-[#F59E0B]" />}
                    <span className="text-muted-foreground">{km.label}</span>
                    <span
                      className={`font-bold ${
                        km.direction === "up"
                          ? "text-[#22C55E]"
                          : km.direction === "down"
                            ? "text-destructive"
                            : "text-[#F59E0B]"
                      }`}
                    >
                      {km.change > 0 ? "+" : ""}
                      {km.change.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {assessments.length >= 1 && (activeMetrics.length > 0 || customMetricKeys.length > 0) && (
          <section className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-accent" />
              Evolução das métricas
            </h2>
            <div className={`grid gap-4 ${isExport ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
              {activeMetrics.map((key) => (
                <div
                  key={key}
                  className="bg-card border border-border rounded-xl p-5"
                  style={{ borderTopWidth: "2px", borderTopColor: CHART_COLORS[key] ?? "#4f46e5" }}
                >
                  <MetricChart
                    assessments={assessments}
                    metricKey={key}
                    label={METRIC_LABELS[key].replace(/ \(.*\)$/, "")}
                    unit={METRIC_LABELS[key].match(/\((.*?)\)/)?.[1] ?? ""}
                    color={CHART_COLORS[key] ?? "#4f46e5"}
                    animate={animate}
                  />
                </div>
              ))}
              {customMetricKeys.map((key) => (
                <div
                  key={key}
                  className="bg-card border border-border rounded-xl p-5"
                  style={{ borderTopWidth: "2px", borderTopColor: CUSTOM_METRIC_COLOR }}
                >
                  <MetricChart
                    assessments={assessments}
                    metricKey={key}
                    label={customMetricLabels[key] ?? key}
                    unit=""
                    color={CUSTOM_METRIC_COLOR}
                    isCustom
                    animate={animate}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-foreground">
            Histórico de avaliações
          </h2>
          {assessments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma avaliação registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {[...assessments].reverse().map((a, i) => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  index={assessments.length - 1 - i}
                  total={assessments.length}
                  metricLabels={customMetricLabels}
                  expandAll={isExport}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-border pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShareBrand
              size={20}
              showAppNameFallback
              textClassName="text-muted-foreground text-xs font-medium"
            />
          </div>
          <span className="text-muted-foreground/50 text-xs">
            Gerado em {new Date().toLocaleDateString("pt-BR")}
          </span>
        </footer>
      </div>
    </div>
  );
});

export default AthleteReportView;
