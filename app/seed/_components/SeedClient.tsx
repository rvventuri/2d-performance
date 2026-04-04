"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, Database, Trash2, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "seeding" | "clearing" | "done" | "cleared" | "error";

interface AthleteResult {
  student: string;
  assessments: number;
  aiStatus: string;
}

const ATHLETES_PREVIEW = [
  { name: "Mateus Assis",       sport: "Futebol · Atacante",          assessments: 6, highlight: "Explosão e 1º passo — assimetria de tornozelo" },
  { name: "Gabriel Monteiro",   sport: "Futebol · Meia (pós-lesão)",  assessments: 5, highlight: "Retorno após distensão coxa D — assimetria 33→5%" },
  { name: "Vitor Hugo Santos",  sport: "Futebol · Zagueiro",          assessments: 6, highlight: "Força e duelos aéreos — RSI limitado pelo peso" },
  { name: "Kauan Ferreira",     sport: "Futebol · Zagueiro sub-20",   assessments: 5, highlight: "CMJ 40→47cm, ciclo elástico em desenvolvimento" },
  { name: "Bruno Lacerda",      sport: "Futebol · Ponta/Extremo",     assessments: 6, highlight: "RSI 1.76→2.24, ciclo elástico excepcional" },
  { name: "Thiago Duarte",      sport: "Futvolei · Profissional",     assessments: 6, highlight: "CMJ 56→64cm, Abalakov 64→73cm (elite)" },
  { name: "Felipe Barros",      sport: "Futvolei · Semi-profissional", assessments: 5, highlight: "Em evolução para circuito regional 2025" },
];

export default function SeedClient() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<AthleteResult[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [error, setError] = useState("");

  const handleSeed = async () => {
    setStatus("seeding");
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao popular banco de dados.");
        setStatus("error");
        return;
      }

      setResults(data.athletes ?? []);
      setAiSummary(data.message ?? "");
      setStatus("done");
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch {
      setError("Erro de conexão. Verifique se está autenticado.");
      setStatus("error");
    }
  };

  const handleClear = async () => {
    setStatus("clearing");
    setError("");

    try {
      const res = await fetch("/api/seed", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao limpar banco de dados.");
        setStatus("error");
        return;
      }

      setStatus("cleared");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Erro de conexão.");
      setStatus("error");
    }
  };

  const totalAssessments = ATHLETES_PREVIEW.reduce((s, a) => s + a.assessments, 0);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary-bright/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-brand-primary-bright" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground tracking-wide mb-2">
            SEED DE DADOS
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Popula o banco com {ATHLETES_PREVIEW.length} atletas reais e {totalAssessments} avaliações para demonstrar o sistema completo.
          </p>
          <p className="text-xs text-amber-500 mt-2 font-mono bg-amber-500/10 rounded px-3 py-1 inline-block">
            Disponível apenas em ambiente de desenvolvimento
          </p>
        </div>

        {/* Preview dos atletas */}
        {status === "idle" && (
          <div className="bg-card border border-border rounded-xl mb-6 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm font-medium">Atletas que serão inseridos</span>
              <span className="ml-auto text-muted-foreground text-xs">{totalAssessments} avaliações no total</span>
            </div>
            <div className="divide-y divide-border">
              {ATHLETES_PREVIEW.map((a) => (
                <div key={a.name} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium">{a.name}</p>
                    <p className="text-muted-foreground text-xs">{a.sport} · {a.highlight}</p>
                  </div>
                  <span className="text-muted-foreground/50 text-xs shrink-0">{a.assessments} aval.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading / Progress */}
        {(status === "seeding" || status === "clearing") && (
          <div className="bg-card border border-border rounded-xl p-8 mb-6 text-center">
            <Loader2 className="w-10 h-10 text-brand-primary-bright animate-spin mx-auto mb-4" />
            <p className="text-foreground font-semibold">
              {status === "seeding" ? "Inserindo atletas e gerando análises de IA..." : "Removendo todos os dados..."}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {status === "seeding"
                ? "As análises são geradas em paralelo — pode levar até 60 segundos."
                : "Aguarde..."}
            </p>
          </div>
        )}

        {/* Success */}
        {status === "done" && (
          <div className="bg-card border border-brand-primary-bright/25 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <CheckCircle2 className="w-6 h-6 text-brand-accent shrink-0" />
              <p className="text-foreground font-semibold">Dados inseridos com sucesso!</p>
            </div>
            {aiSummary && (
              <p className="text-muted-foreground text-xs mb-4 pl-9">{aiSummary}</p>
            )}
            <div className="space-y-2 mb-4">
              {results.map((r) => (
                <div key={r.student} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-muted-foreground truncate">{r.student}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-muted-foreground text-xs">{r.assessments} aval.</span>
                    <span className={`text-xs font-medium ${r.aiStatus.startsWith("✓") ? "text-brand-accent-glow" : "text-destructive"}`}>
                      {r.aiStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">Redirecionando para o dashboard...</p>
          </div>
        )}

        {/* Cleared */}
        {status === "cleared" && (
          <div className="bg-card border border-border rounded-xl p-8 mb-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">Todos os dados foram removidos.</p>
            <p className="text-muted-foreground text-sm mt-1">Redirecionando...</p>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground font-semibold text-sm mb-1">Erro ao executar operação</p>
              <p className="text-destructive text-sm">{error}</p>
              <p className="text-muted-foreground text-xs mt-2">
                Verifique se você está autenticado e se o SCHEMA.sql foi executado no Supabase (incluindo a tabela ai_analyses).
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {(status === "idle" || status === "error") && (
          <div className="flex gap-3">
            <Button
              onClick={handleSeed}
              className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-bold cursor-pointer h-11"
            >
              <Database className="w-4 h-4 mr-2" />
              Popular banco de dados
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 cursor-pointer h-11"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar tudo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
