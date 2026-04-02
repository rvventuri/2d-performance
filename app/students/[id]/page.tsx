"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getStudent, getStudentAssessments, deleteStudent, deleteAssessment } from "@/lib/storage";
import { Student, Assessment, Metrics } from "@/lib/types";
import { analyzeAssessment, calcEvolution } from "@/lib/analysis";
import AiAnalysisTab from "@/components/ai-analysis-tab";
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
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#0F172A]/80 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="w-10 h-10 bg-[#1E293B] rounded-lg flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-[#94A3B8]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-bold text-white">{formatDate(assessment.date)}</span>
            {hasWarning && (
              <Badge className="bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Alerta
              </Badge>
            )}
          </div>
          <p className="text-[#94A3B8] text-xs mt-0.5">
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
                  className="text-[#475569] hover:text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <Trash2 className="w-4 h-4" />
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0F172A] border-[#1E293B]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Excluir avaliação?</AlertDialogTitle>
                <AlertDialogDescription className="text-[#94A3B8]">
                  Esta ação não pode ser desfeita. A avaliação de {formatDate(assessment.date)} será permanentemente excluída.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B] bg-transparent cursor-pointer">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(assessment.id)}
                  className="bg-[#EF4444] hover:bg-[#DC2626] text-white cursor-pointer"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {open ? (
            <ChevronUp className="w-4 h-4 text-[#475569]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#475569]" />
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-[#1E293B] p-4 space-y-4">
          <EvolutionCard evolutions={evolutions} />
          <div>
            <h4 className="font-heading text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
              Análise Automática
            </h4>
            <AnalysisInsights insights={insights} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    try {
      const [s, ass] = await Promise.all([
        getStudent(id),
        getStudentAssessments(id),
      ]);
      if (!s) {
        router.push("/");
        return;
      }
      setStudent(s);
      setAssessments(ass);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar dados";
      toast.error(msg);
      router.push("/");
    } finally {
      setPageLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteStudent = async () => {
    try {
      await deleteStudent(id);
      toast.success("Aluno excluído com sucesso.");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir aluno");
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      await deleteAssessment(assessmentId);
      toast.success("Avaliação excluída.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir avaliação");
    }
  };

  if (pageLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-brand-blue-light" />
    </div>
  );

  if (!student) return null;

  const latest = assessments.length > 0 ? assessments[assessments.length - 1] : null;
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : undefined;
  const latestInsights = latest ? analyzeAssessment(latest, previous) : [];
  const hasWarning = latestInsights.some((i) => i.type === "warning");

  const metricsWithData = (Object.keys(CHART_COLORS) as (keyof Metrics)[]).filter((key) =>
    assessments.some((a) => a.metrics[key] !== null)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-wide">
                {student.name.toUpperCase()}
              </h1>
              {hasWarning && (
                <Badge className="bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Alerta Ativo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {student.age > 0 && (
                <span className="text-[#94A3B8] text-sm">{student.age} anos</span>
              )}
              {student.weight > 0 && (
                <span className="text-[#94A3B8] text-sm">{student.weight} kg</span>
              )}
              {student.height > 0 && (
                <span className="text-[#94A3B8] text-sm">{student.height} cm</span>
              )}
              <span className="text-[#475569] text-sm">
                {assessments.length} {assessments.length === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
            {student.objective && (
              <p className="text-[#475569] text-sm mt-1 max-w-lg">{student.objective}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/students/${id}/assessment/new`}>
              <Button className="bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-bold cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </Link>
            <Link href={`/students/${id}/edit`}>
              <Button variant="outline" size="sm" className="border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#1E293B] text-[#475569] hover:text-[#EF4444] hover:border-[#EF4444]/30 hover:bg-[#EF4444]/5 cursor-pointer"
                  />
                }
              >
                <Trash2 className="w-4 h-4" />
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0F172A] border-[#1E293B]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Excluir aluno?</AlertDialogTitle>
                  <AlertDialogDescription className="text-[#94A3B8]">
                    Isso irá excluir <strong className="text-white">{student.name}</strong> e todas as suas {assessments.length} avaliações. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B] bg-transparent cursor-pointer">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteStudent} className="bg-[#EF4444] hover:bg-[#DC2626] text-white cursor-pointer">
                    Excluir Aluno
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="history">
        <TabsList className="bg-[#0F172A] border border-[#1E293B] mb-6 w-full sm:w-auto">
          <TabsTrigger value="history" className="cursor-pointer data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-[#94A3B8] flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="charts" className="cursor-pointer data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-[#94A3B8] flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="ai" className="cursor-pointer data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-[#94A3B8] flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Análise IA
          </TabsTrigger>
          <TabsTrigger value="report" className="cursor-pointer data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-[#94A3B8] flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Relatório
          </TabsTrigger>
        </TabsList>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          {assessments.length === 0 ? (
            <div className="text-center py-16 bg-[#0F172A] border border-[#1E293B] rounded-xl">
              <Activity className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-white mb-2">Nenhuma avaliação</h3>
              <p className="text-[#94A3B8] text-sm mb-6">
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
            <div className="text-center py-16 bg-[#0F172A] border border-[#1E293B] rounded-xl">
              <BarChart3 className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
              <p className="text-[#94A3B8] text-sm">Nenhuma avaliação para exibir gráficos.</p>
            </div>
          ) : metricsWithData.length === 0 ? (
            <div className="text-center py-16 bg-[#0F172A] border border-[#1E293B] rounded-xl">
              <p className="text-[#94A3B8] text-sm">Registre métricas nas avaliações para ver os gráficos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {metricsWithData.map((key) => (
                <div key={key} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5" style={{ borderTopWidth: "2px", borderTopColor: CHART_COLORS[key] }}>
                  <MetricChart
                    assessments={assessments}
                    metricKey={key}
                    color={CHART_COLORS[key]}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI TAB */}
        <TabsContent value="ai">
          <AiAnalysisTab student={student} assessments={assessments} />
        </TabsContent>

        {/* REPORT TAB */}
        <TabsContent value="report">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 sm:p-6">
            <PerformanceReport student={student} assessments={assessments} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
