import {
  Users,
  UserPlus,
  Activity,
  Brain,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Timer,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
} from "lucide-react";
import MetricCard from "./_components/MetricCard";
import SignupsChart from "./_components/SignupsChart";
import { GetAdminMetricsUseCase } from "@/application/admin/GetAdminMetricsUseCase";
import { SupabaseAdminRepository } from "@/infrastructure/supabase/AdminRepository";
import type { AdminTrainerStat, AiUsageStats } from "@/lib/types";

async function loadMetrics() {
  const repo = new SupabaseAdminRepository();
  const useCase = new GetAdminMetricsUseCase(repo);
  return useCase.execute();
}

// Claude Sonnet pricing (USD per million tokens)
const PRICE_INPUT_PER_M = 3;
const PRICE_OUTPUT_PER_M = 15;

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function AiPerformanceCard({ stats }: { stats: AiUsageStats }) {
  const estimatedCost =
    (stats.totalInputTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (stats.totalOutputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;

  const items = [
    {
      label: "Tempo médio de resposta",
      value: formatDuration(stats.avgDurationMs),
      icon: Timer,
      color: "#2E5BFF",
    },
    {
      label: "Tokens de entrada (total)",
      value: formatTokens(stats.totalInputTokens),
      icon: ArrowDownToLine,
      color: "#6366f1",
    },
    {
      label: "Tokens de saída (total)",
      value: formatTokens(stats.totalOutputTokens),
      icon: ArrowUpFromLine,
      color: "#8b5cf6",
    },
    {
      label: "Custo estimado (USD)",
      value: `$${estimatedCost.toFixed(4)}`,
      icon: DollarSign,
      color: "#22c55e",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-brand-blue-light" />
        <h2 className="font-heading text-lg font-bold text-foreground">
          IA — Performance
        </h2>
        <span className="ml-auto text-muted-foreground text-xs">
          Claude Sonnet · acumulado
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${item.color}1a` }}
            >
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium leading-tight">
                {item.label}
              </p>
              <p className="font-heading text-xl font-bold text-foreground">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiStatusCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}1a` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="font-heading text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function TrainersTable({ trainers }: { trainers: AdminTrainerStat[] }) {
  if (trainers.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Nenhum trainer cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-muted-foreground font-medium text-xs uppercase tracking-wider pb-3 pr-4">
              Trainer
            </th>
            <th className="text-right text-muted-foreground font-medium text-xs uppercase tracking-wider pb-3 px-4">
              Alunos
            </th>
            <th className="text-right text-muted-foreground font-medium text-xs uppercase tracking-wider pb-3 pl-4">
              Avaliações
            </th>
          </tr>
        </thead>
        <tbody>
          {trainers.map((t, i) => (
            <tr
              key={t.userId}
              className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-blue-mid/20 border border-brand-blue-light/25 flex items-center justify-center shrink-0">
                    <span className="text-brand-blue-light text-xs font-bold">
                      {t.name[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate max-w-[200px]">
                      {t.name}
                    </p>
                    {t.email && t.email !== t.name && (
                      <p className="text-muted-foreground text-xs truncate max-w-[200px]">
                        {t.email}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="font-heading font-bold text-foreground">
                  {t.studentCount}
                </span>
              </td>
              <td className="py-3 pl-4 text-right">
                <span className="font-heading font-bold text-foreground">
                  {t.assessmentCount}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPage() {
  const metrics = await loadMetrics();

  const { aiAnalysesByStatus, aiUsageStats } = metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl font-bold text-foreground tracking-wide mb-1">
          ADMIN
        </h1>
        <p className="text-muted-foreground text-sm">
          Visão geral do sistema — métricas de uso e crescimento
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Trainers"
          value={metrics.totalTrainers}
          sub={`+${metrics.newTrainersLast30Days} nos últimos 30 dias`}
          color="#2E5BFF"
        />
        <MetricCard
          icon={UserPlus}
          label="Novos (30d)"
          value={metrics.newTrainersLast30Days}
          color="#1437C9"
        />
        <MetricCard
          icon={Users}
          label="Atletas"
          value={metrics.totalStudents}
          color="#FFD400"
        />
        <MetricCard
          icon={Activity}
          label="Avaliações"
          value={metrics.totalAssessments}
          color="#2E5BFF"
        />
      </div>

      {/* AI Analyses breakdown + Signups chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Analyses */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-brand-blue-light" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              Análises de IA
            </h2>
            <span className="ml-auto text-muted-foreground text-sm font-medium">
              {aiAnalysesByStatus.done +
                aiAnalysesByStatus.pending +
                aiAnalysesByStatus.running +
                aiAnalysesByStatus.error}{" "}
              total
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AiStatusCard
              label="Concluídas"
              value={aiAnalysesByStatus.done}
              color="#22c55e"
              icon={CheckCircle2}
            />
            <AiStatusCard
              label="Pendentes"
              value={aiAnalysesByStatus.pending}
              color="#eab308"
              icon={Clock}
            />
            <AiStatusCard
              label="Em execução"
              value={aiAnalysesByStatus.running}
              color="#2E5BFF"
              icon={Loader2}
            />
            <AiStatusCard
              label="Com erro"
              value={aiAnalysesByStatus.error}
              color="#ef4444"
              icon={XCircle}
            />
          </div>
        </div>

        {/* Signups chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-brand-blue-light" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              Novos Cadastros
            </h2>
            <span className="ml-auto text-muted-foreground text-xs">
              Últimos 6 meses
            </span>
          </div>
          <SignupsChart data={metrics.signupsPerMonth} />
        </div>
      </div>

      {/* AI Performance */}
      <AiPerformanceCard stats={aiUsageStats} />

      {/* Top trainers table */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-brand-blue-light" />
          <h2 className="font-heading text-lg font-bold text-foreground">
            Top Trainers
          </h2>
          <span className="ml-auto text-muted-foreground text-xs">
            por nº de atletas
          </span>
        </div>
        <TrainersTable trainers={metrics.topTrainers} />
      </div>
    </div>
  );
}
