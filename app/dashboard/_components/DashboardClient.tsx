"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import {
  Search, Plus, User, ChevronRight,
  Activity, Calendar, TrendingUp, Users,
  Sparkles, Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import OnboardingChecklist from "./OnboardingChecklist";
import { clearDemoDataAction } from "../_actions";

export interface StudentWithStats {
  id: string;
  name: string;
  age: number;
  objective: string;
  photoUrl: string | null;
  isDemo: boolean;
  assessmentCount: number;
  lastAssessmentDate: string | null;
}

export interface OnboardingState {
  isProfileConfigured: boolean;
  hasStudents: boolean;
  hasAssessments: boolean;
  firstStudentId: string | null;
}

interface Props {
  students: StudentWithStats[];
  totalAssessments: number;
  onboardingState: OnboardingState;
  hasDemoData: boolean;
}

export default function DashboardClient({
  students,
  totalAssessments,
  onboardingState,
  hasDemoData,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, startClearTransition] = useTransition();

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const withHistory = students.filter((s) => s.assessmentCount >= 2).length;

  function handleConfirmClearDemo() {
    startClearTransition(async () => {
      const result = await clearDemoDataAction();
      setClearDialogOpen(false);
      if (result.ok) {
        router.refresh();
        toast.success(
          result.deletedStudents > 0
            ? "Dados de demonstração removidos. Você pode cadastrar seus alunos reais."
            : "Nenhum dado de demonstração para remover."
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-foreground tracking-wide mb-1">DASHBOARD</h1>
        <p className="text-muted-foreground text-sm">Gerencie seus alunos e acompanhe a evolução de performance</p>
      </div>

      {hasDemoData && (
        <div className="mb-6 rounded-xl border border-brand-primary-bright/35 bg-brand-primary/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-accent-glow" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold text-foreground">Modo demonstração</p>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Estes alunos e análises são fictícios para você explorar o produto. Limpe quando quiser
                começar com seus dados reais.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setClearDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar demonstração
          </Button>
        </div>
      )}

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar dados de demonstração?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os alunos marcados como demonstração serão removidos, junto com avaliações e análises de IA
              associadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleConfirmClearDemo();
              }}
            >
              {isClearing ? "Removendo…" : "Limpar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OnboardingChecklist state={onboardingState} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users,      color: "#1437C9", label: "Alunos",       value: students.length },
          { icon: Activity,   color: "#2E5BFF", label: "Avaliações",   value: totalAssessments },
          { icon: TrendingUp, color: "#FFD400", label: "Com histórico", value: withHistory },
        ].map(({ icon: Icon, color, label, value }, i) => (
          <div
            key={label}
            className={`bg-card border border-border rounded-xl p-4 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}1a` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
                <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + New */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-brand-primary-bright transition-colors"
          />
        </div>
        <Link href="/students/new">
          <Button className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-semibold cursor-pointer shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          {students.length === 0 ? (
            <>
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">Nenhum aluno cadastrado</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Comece cadastrando seu primeiro aluno para iniciar as avaliações.
              </p>
              <Link href="/students/new">
                <Button className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-semibold cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground">Nenhum aluno encontrado para &ldquo;{search}&rdquo;</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`}>
              <div className="bg-card border border-border hover:border-brand-primary-bright/35 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 group">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-depth border border-border group-hover:border-brand-primary-bright/40 flex items-center justify-center shrink-0 transition-colors relative">
                  {student.photoUrl ? (
                    <Image
                      src={student.photoUrl}
                      alt={student.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground group-hover:text-brand-primary-bright transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-heading text-lg font-bold text-foreground truncate">{student.name}</h3>
                    <Badge variant="secondary" className="bg-secondary text-muted-foreground text-xs border-0 shrink-0">
                      {student.age} anos
                    </Badge>
                    {student.isDemo && (
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-wider border-brand-primary-bright/40 text-brand-accent-glow shrink-0"
                      >
                        Demo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {student.assessmentCount} {student.assessmentCount === 1 ? "avaliação" : "avaliações"}
                    </span>
                    {student.lastAssessmentDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Última: {formatDate(student.lastAssessmentDate)}
                      </span>
                    )}
                    {student.objective && (
                      <span className="hidden sm:block truncate max-w-xs">{student.objective}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {student.assessmentCount >= 2 && (
                    <Badge className="bg-brand-primary/15 text-brand-accent-glow border-brand-primary-bright/25 text-xs hidden sm:flex">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Histórico
                    </Badge>
                  )}
                  <ChevronRight className="w-5 h-5 text-border group-hover:text-brand-primary-bright transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
