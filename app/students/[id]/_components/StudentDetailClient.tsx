"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStudent, getStudentAssessments, deleteStudent, deleteAssessment, getMetricConfigs } from "@/lib/storage";
import { Student, Assessment, Metrics } from "@/lib/types";
import { resolveMetricConfigs, getEnabledMetrics } from "@/domain/trainer/services/MetricConfigResolver";
import { analyzeAssessment, calcEvolution } from "@/lib/analysis";
import AiAnalysisTab from "@/components/ai-analysis-tab";
import ShareDialog from "@/components/share-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MetricChart from "@/components/metric-chart";
import AnalysisInsights from "@/components/analysis-insights";
import EvolutionCard from "@/components/evolution-card";
import PerformanceReport from "@/components/performance-report";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Activity,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Sparkles,
  Share2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const CHART_COLORS: Record<string, string> = {
  cmj: "#1437C9",
  sj: "#2E5BFF",
  abalakov: "#F59E0B",
  rsi: "#EC4899",
  tempoContato: "#8B5CF6",
  alturaSaltoDJ: "#06B6D4",
  cmjEsquerdo: "#F97316",
  cmjDireito: "#84CC16",
  assimetriaPercentual: "#EF4444",
  saltoHorizontal: "#14B8A6",
};

const CUSTOM_METRIC_COLORS = [
  "#A855F7", "#F97316", "#22D3EE", "#84CC16", "#F43F5E",
  "#FBBF24", "#34D399", "#60A5FA", "#C084FC", "#FB7185",
];

function AssessmentRow({
  assessment,
  previous,
  onDelete,
}: {
  assessment: Assessment;
  previous?: Assessment;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const insights = analyzeAssessment(assessment, previous);
  const evolutions = calcEvolution(assessment, previous);
  const hasWarning = insights.some((i) => i.type === "warning");
  const metricsWithData = evolutions.filter((e) => e.current !== null);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-bold text-foreground">{formatDate(assessment.date)}</span>
            {hasWarning && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Alerta
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">
            {metricsWithData.length} {metricsWithData.length === 1 ? "métrica" : "métricas"} registradas
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <Trash2 className="w-4 h-4" />
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Excluir avaliação?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Esta ação não pode ser desfeita. A avaliação de {formatDate(assessment.date)} será permanentemente excluída.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border text-muted-foreground hover:bg-accent bg-transparent cursor-pointer">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(assessment.id)}
                  className="bg-destructive hover:bg-destructive/90 text-white cursor-pointer"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <EvolutionCard evolutions={evolutions} />
          <div>
            <h4 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Análise Automática
            </h4>
            <AnalysisInsights insights={insights} />
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  id: string;
  initialStudent: Student;
  initialAssessments: Assessment[];
  initialResolvedMetrics: ReturnType<typeof resolveMetricConfigs>;
}

export default function StudentDetailClient({
  id,
  initialStudent,
  initialAssessments,
  initialResolvedMetrics,
}: Props) {
  const router = useRouter();

  const [student, setStudent] = useState<Student>(initialStudent);
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [resolvedMetrics, setResolvedMetrics] = useState(initialResolvedMetrics);
  const [pageLoading, setPageLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const refresh = useCallback(async () => {
    setPageLoading(true);
    try {
      const [s, ass, configs] = await Promise.all([
        getStudent(id),
        getStudentAssessments(id),
        getMetricConfigs(),
      ]);
      setResolvedMetrics(resolveMetricConfigs(configs));
      if (!s) {
        router.push("/dashboard");
        return;
      }
      setStudent(s);
      setAssessments(ass);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao recarregar dados");
    } finally {
      setPageLoading(false);
    }
  }, [id, router]);

  const handleDeleteStudent = async () => {
    try {
      await deleteStudent(id);
      toast.success("Aluno excluído com sucesso.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir aluno");
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      await deleteAssessment(assessmentId);
      toast.success("Avaliação excluída.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir avaliação");
    }
  };

  if (pageLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue-light" />
    </div>
  );

  const latest = assessments.length > 0 ? assessments[assessments.length - 1] : null;
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : undefined;
  const latestInsights = latest ? analyzeAssessment(latest, previous) : [];
  const hasWarning = latestInsights.some((i) => i.type === "warning");

  const enabledDefaultKeys = getEnabledMetrics(resolvedMetrics)
    .filter((m) => !m.isCustom)
    .map((m) => m.key);

  const enabledCustom = getEnabledMetrics(resolvedMetrics).filter((m) => m.isCustom);

  const defaultMetricsWithData = (Object.keys(CHART_COLORS) as (keyof Metrics)[]).filter(
    (key) => enabledDefaultKeys.includes(key) && assessments.some((a) => a.metrics[key] !== null)
  );

  const customMetricsWithData = enabledCustom.filter((m) =>
    assessments.some((a) => (a.customMetrics ?? {})[m.key] != null)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-brand-blue-dark border-2 border-border flex items-center justify-center shrink-0 relative">
              {student.photoUrl ? (
                <Image
                  src={student.photoUrl}
                  alt={student.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <span className="font-heading text-2xl font-bold text-brand-blue-light select-none">
                  {student.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-wide">
                  {student.name.toUpperCase()}
                </h1>
                {hasWarning && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Alerta Ativo
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {student.age > 0 && <span className="text-muted-foreground text-sm">{student.age} anos</span>}
                {student.weight > 0 && <span className="text-muted-foreground text-sm">{student.weight} kg</span>}
                {student.height > 0 && <span className="text-muted-foreground text-sm">{student.height} cm</span>}
                <span className="text-muted-foreground text-sm">
                  {assessments.length} {assessments.length === 1 ? "avaliação" : "avaliações"}
                </span>
              </div>
              {student.objective && (
                <p className="text-muted-foreground text-sm mt-1 max-w-lg">{student.objective}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/students/${id}/assessment/new`}>
              <Button className="bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-bold cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="border-border text-muted-foreground hover:text-brand-blue-light hover:bg-accent cursor-pointer gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Compartilhar</span>
            </Button>
            <Link href={`/students/${id}/edit`}>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                  />
                }
              >
                <Trash2 className="w-4 h-4" />
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Excluir aluno?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Isso irá excluir <strong className="text-foreground">{student.name}</strong> e todas as suas{" "}
                    {assessments.length} avaliações. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-muted-foreground hover:bg-accent bg-transparent cursor-pointer">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive hover:bg-destructive/90 text-white cursor-pointer">
                    Excluir Aluno
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="history">
        <TabsList className="bg-card border border-border mb-6 w-full sm:w-auto">
          <TabsTrigger value="history" className="cursor-pointer data-[state=active]:bg-accent data-[state=active]:text-foreground text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="charts" className="cursor-pointer data-[state=active]:bg-accent data-[state=active]:text-foreground text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="ai" className="cursor-pointer data-[state=active]:bg-accent data-[state=active]:text-foreground text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Análise IA
          </TabsTrigger>
          <TabsTrigger value="report" className="cursor-pointer data-[state=active]:bg-accent data-[state=active]:text-foreground text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Relatório
          </TabsTrigger>
        </TabsList>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          {assessments.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Activity className="w-12 h-12 text-border mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">Nenhuma avaliação</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Registre a primeira avaliação para começar a acompanhar a evolução.
              </p>
              <Link href={`/students/${id}/assessment/new`}>
                <Button className="bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-bold cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Avaliação
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...assessments].reverse().map((assessment, idx) => {
                const reversedIndex = assessments.length - 1 - idx;
                const prev = reversedIndex > 0 ? assessments[reversedIndex - 1] : undefined;
                return (
                  <AssessmentRow
                    key={assessment.id}
                    assessment={assessment}
                    previous={prev}
                    onDelete={handleDeleteAssessment}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* CHARTS TAB */}
        <TabsContent value="charts">
          {assessments.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <BarChart3 className="w-12 h-12 text-border mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Nenhuma avaliação para exibir gráficos.</p>
            </div>
          ) : defaultMetricsWithData.length === 0 && customMetricsWithData.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground text-sm">Registre métricas nas avaliações para ver os gráficos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {defaultMetricsWithData.map((key) => {
                const m = resolvedMetrics.find((r) => r.key === key);
                return (
                  <div key={key} className="bg-card border border-border rounded-xl p-5" style={{ borderTopWidth: "2px", borderTopColor: CHART_COLORS[key] }}>
                    <MetricChart
                      assessments={assessments}
                      metricKey={key}
                      label={m?.label ?? key}
                      unit={m?.unit ?? ""}
                      color={CHART_COLORS[key]}
                    />
                  </div>
                );
              })}
              {customMetricsWithData.map((m, idx) => {
                const color = CUSTOM_METRIC_COLORS[idx % CUSTOM_METRIC_COLORS.length];
                return (
                  <div key={m.key} className="bg-card border border-border rounded-xl p-5" style={{ borderTopWidth: "2px", borderTopColor: color }}>
                    <MetricChart
                      assessments={assessments}
                      metricKey={m.key}
                      label={m.label}
                      unit={m.unit}
                      color={color}
                      isCustom
                    />
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* AI TAB */}
        <TabsContent value="ai">
          <AiAnalysisTab student={student} assessments={assessments} />
        </TabsContent>

        {/* REPORT TAB */}
        <TabsContent value="report">
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
            <PerformanceReport student={student} assessments={assessments} />
          </div>
        </TabsContent>
      </Tabs>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        studentId={student.id}
        studentName={student.name}
      />
    </div>
  );
}
