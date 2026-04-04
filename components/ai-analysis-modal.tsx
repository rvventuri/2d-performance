"use client";

import { useState, useRef, useEffect } from "react";
import { Student, Assessment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Copy, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { sendGtagEvent } from "@/lib/gtag";

interface AiAnalysisModalProps {
  student: Student;
  assessments: Assessment[];
}

type Status = "idle" | "loading" | "streaming" | "done" | "error";

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        // H2 — ##
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="font-heading text-lg font-bold text-foreground mt-4 mb-1 tracking-wide">
              {line.replace("## ", "")}
            </h2>
          );
        }
        // H3 — ###
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="font-heading text-base font-bold text-brand-primary-bright mt-3 mb-1">
              {line.replace("### ", "")}
            </h3>
          );
        }
        // Bold heading with number prefix (e.g. "**1. Resumo Geral**")
        if (line.match(/^\*\*\d+\./)) {
          const cleaned = line.replace(/\*\*/g, "");
          return (
            <h3 key={i} className="font-heading text-base font-bold text-brand-primary-bright mt-4 mb-1">
              {cleaned}
            </h3>
          );
        }
        // Bullet points
        if (line.startsWith("- ") || line.startsWith("• ")) {
          const content = line.replace(/^[-•] /, "");
          return (
            <div key={i} className="flex gap-2 text-foreground/80 text-sm leading-relaxed">
              <span className="text-brand-accent-glow shrink-0 mt-0.5">→</span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
            </div>
          );
        }
        // Numbered list
        if (line.match(/^\d+\. /)) {
          const [num, ...rest] = line.split(". ");
          return (
            <div key={i} className="flex gap-2 text-foreground/80 text-sm leading-relaxed">
              <span className="text-brand-primary-bright font-bold shrink-0 w-4">{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(rest.join(". ")) }} />
            </div>
          );
        }
        // Warning line
        if (line.includes("⚠️")) {
          return (
            <div key={i} className="flex gap-2 items-start bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span className="text-destructive text-sm"
                dangerouslySetInnerHTML={{ __html: renderInline(line.replace("⚠️", "").trim()) }}
              />
            </div>
          );
        }
        // Normal paragraph
        return (
          <p key={i} className="text-foreground/80 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderInline(line) }}
          />
        );
      })}
    </div>
  );
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-muted-foreground">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-secondary text-brand-primary-bright px-1 rounded text-xs">$1</code>');
}

export default function AiAnalysisModal({ student, assessments }: AiAnalysisModalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current && status === "streaming") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, status]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const analyze = async () => {
    setContent("");
    setStatus("loading");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/analyze-athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student, assessments }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        setContent(err.error || "Erro na requisição");
        setStatus("error");
        return;
      }

      sendGtagEvent("ai_analysis_requested", { source: "modal" });

      setStatus("streaming");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Sem stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }

      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setStatus("idle");
        return;
      }
      setContent("Erro ao conectar com a API. Verifique sua ANTHROPIC_API_KEY no arquivo .env.local");
      setStatus("error");
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (status === "idle") analyze();
  };

  const handleClose = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  const handleRetry = () => {
    setStatus("idle");
    analyze();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Relatório copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (assessments.length === 0) return null;

  return (
    <>
      <Button
        onClick={handleOpen}
        className="bg-gradient-to-r from-brand-depth to-brand-primary-bright hover:from-[#312e81] hover:to-[#5b21b6] text-primary-foreground font-bold cursor-pointer transition-all duration-200 shadow-lg shadow-[#4f46e5]/35"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Analisar com IA
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-depth to-brand-primary-bright rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground tracking-wide">
                    ANÁLISE COM IA
                  </h2>
                  <p className="text-muted-foreground text-xs">{student.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status === "done" && (
                  <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-8"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-brand-accent" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
                {status === "error" && (
                  <Button
                    onClick={handleRetry}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-8"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Info bar */}
            <div className="px-6 py-2 bg-secondary/50 border-b border-border shrink-0">
              <p className="text-muted-foreground text-xs">
                Modelo: <span className="text-foreground">Claude Opus 4.6</span>
                {" · "}
                {assessments.length} {assessments.length === 1 ? "avaliação" : "avaliações"} analisadas
                {" · "}
                Última: <span className="text-foreground">{assessments[assessments.length - 1].date}</span>
              </p>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 min-h-0">
              {status === "loading" && (
                <div className="flex items-center gap-4 py-12 justify-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-depth to-brand-primary-bright rounded-xl flex items-center justify-center animate-pulse">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">Analisando dados de performance...</p>
                    <p className="text-muted-foreground text-sm">Claude está processando as métricas do atleta</p>
                  </div>
                </div>
              )}

              {(status === "streaming" || status === "done") && content && (
                <div>
                  <MarkdownText text={content} />
                  {status === "streaming" && (
                    <span className="inline-block w-2 h-4 bg-brand-accent animate-pulse ml-1 rounded-sm" />
                  )}
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold mb-1">Erro na análise</p>
                    <p className="text-muted-foreground text-sm max-w-md">{content}</p>
                  </div>
                  <Button
                    onClick={handleRetry}
                    className="bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            {status === "done" && (
              <div className="px-6 py-3 border-t border-border shrink-0 flex items-center justify-between">
                <p className="text-muted-foreground/50 text-xs">
                  Análise gerada por IA — use como suporte à decisão, não como diagnóstico definitivo
                </p>
                <Button
                  onClick={handleRetry}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer text-xs h-7"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
