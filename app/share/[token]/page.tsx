"use client";

import { useState, useEffect, useCallback } from "react";
import { Assessment, AiAnalysisData, ShareAthleteData } from "@/lib/types";
import { use } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import AthleteReportView from "@/components/athlete-report/AthleteReportView";
import { ShareBrand } from "@/components/athlete-report/ShareBrand";

function PasswordGate({ onSubmit, error }: { onSubmit: (pw: string) => void; error?: string }) {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-3">
            <ShareBrand size={36} showAppNameFallback />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Link protegido</h1>
          <p className="text-muted-foreground text-sm">Seu treinador definiu uma senha para este link.</p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Digite a senha"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pw.trim() && onSubmit(pw.trim())}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-accent/50 text-sm"
          />
          {error && (
            <p className="text-destructive text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
          <button
            type="button"
            disabled={!pw.trim()}
            onClick={() => onSubmit(pw.trim())}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground font-bold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Acessar
          </button>
        </div>
      </div>
    </div>
  );
}

type Phase = "loading" | "password" | "view" | "not_found" | "error";

const SESSION_KEY = (token: string) => `share_pw_${token}`;

export default function ShareAthletePublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [phase, setPhase] = useState<Phase>("loading");
  const [pwError, setPwError] = useState<string | undefined>();
  const [student, setStudent] = useState<ShareAthleteData["student"] | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisData | null>(null);
  const [customMetricLabels, setCustomMetricLabels] = useState<Record<string, string>>({});

  const fetchData = useCallback(
    async (password?: string) => {
      try {
        const body: Record<string, string> = {};
        if (password) body.password = password;

        const res = await fetch(`/api/share/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.status === 404) { setPhase("not_found"); return; }

        const data = await res.json();

        if (res.status === 403 && data.requiresPassword) { setPhase("password"); return; }
        if (res.status === 401) { setPwError("Senha incorreta"); setPhase("password"); return; }
        if (!res.ok) { setPhase("error"); return; }

        setStudent(data.student);
        setAssessments(data.assessments ?? []);
        setAiAnalysis(data.aiAnalysis ?? null);
        setCustomMetricLabels(data.customMetricLabels ?? {});
        setPwError(undefined);

        if (password) sessionStorage.setItem(SESSION_KEY(token), password);
        setPhase("view");
      } catch {
        setPhase("error");
      }
    },
    [token]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY(token));
    void (async () => { await fetchData(saved ?? undefined); })();
  }, [fetchData, token]);

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary-bright" />
      </div>
    );
  }

  if (phase === "password") {
    return <PasswordGate onSubmit={(pw) => { setPhase("loading"); fetchData(pw); }} error={pwError} />;
  }

  if (phase === "not_found") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-[#F59E0B] mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Link não encontrado</h1>
          <p className="text-muted-foreground text-sm">Este link foi revogado ou nunca existiu.</p>
        </div>
      </div>
    );
  }

  if (phase === "error" || !student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Algo deu errado</h1>
          <p className="text-muted-foreground text-sm">Tente recarregar a página.</p>
        </div>
      </div>
    );
  }

  return (
    <AthleteReportView
      student={student}
      assessments={assessments}
      aiAnalysis={aiAnalysis}
      customMetricLabels={customMetricLabels}
      mode="screen"
    />
  );
}
