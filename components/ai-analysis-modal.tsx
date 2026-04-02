"use client";

import { useState, useRef, useEffect } from "react";
import { Student, Assessment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Copy, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
            <h2 key={i} className="font-heading text-lg font-bold text-white mt-4 mb-1 tracking-wide">
              {line.replace("## ", "")}
            </h2>
          );
        }
        // H3 — ###
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="font-heading text-base font-bold text-[#22C55E] mt-3 mb-1">
              {line.replace("### ", "")}
            </h3>
          );
        }
        // Bold heading with number prefix (e.g. "**1. Resumo Geral**")
        if (line.match(/^\*\*\d+\./)) {
          const cleaned = line.replace(/\*\*/g, "");
          return (
            <h3 key={i} className="font-heading text-base font-bold text-[#22C55E] mt-4 mb-1">
              {cleaned}
            </h3>
          );
        }
        // Bullet points
        if (line.startsWith("- ") || line.startsWith("• ")) {
          const content = line.replace(/^[-•] /, "");
          return (
            <div key={i} className="flex gap-2 text-[#CBD5E1] text-sm leading-relaxed">
              <span className="text-[#22C55E] shrink-0 mt-0.5">→</span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
            </div>
          );
        }
        // Numbered list
        if (line.match(/^\d+\. /)) {
          const [num, ...rest] = line.split(". ");
          return (
            <div key={i} className="flex gap-2 text-[#CBD5E1] text-sm leading-relaxed">
              <span className="text-[#3B82F6] font-bold shrink-0 w-4">{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(rest.join(". ")) }} />
            </div>
          );
        }
        // Warning line
        if (line.includes("⚠️")) {
          return (
            <div key={i} className="flex gap-2 items-start bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <span className="text-[#FCA5A5] text-sm"
                dangerouslySetInnerHTML={{ __html: renderInline(line.replace("⚠️", "").trim()) }}
              />
            </div>
          );
        }
        // Normal paragraph
        return (
          <p key={i} className="text-[#CBD5E1] text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderInline(line) }}
          />
        );
      })}
    </div>
  );
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#94A3B8]">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[#1E293B] text-[#22C55E] px-1 rounded text-xs">$1</code>');
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
        className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-bold cursor-pointer transition-all duration-200 shadow-lg shadow-purple-900/20"
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
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                    ANÁLISE COM IA
                  </h2>
                  <p className="text-[#94A3B8] text-xs">{student.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status === "done" && (
                  <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="sm"
                    className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer h-8"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#22C55E]" />
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
                    className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer h-8"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Info bar */}
            <div className="px-6 py-2 bg-[#1E293B]/50 border-b border-[#1E293B] shrink-0">
              <p className="text-[#475569] text-xs">
                Modelo: <span className="text-[#94A3B8]">Claude Opus 4.6</span>
                {" · "}
                {assessments.length} {assessments.length === 1 ? "avaliação" : "avaliações"} analisadas
                {" · "}
                Última: <span className="text-[#94A3B8]">{assessments[assessments.length - 1].date}</span>
              </p>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 min-h-0">
              {status === "loading" && (
                <div className="flex items-center gap-4 py-12 justify-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-xl flex items-center justify-center animate-pulse">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Analisando dados de performance...</p>
                    <p className="text-[#94A3B8] text-sm">Claude está processando as métricas do atleta</p>
                  </div>
                </div>
              )}

              {(status === "streaming" || status === "done") && content && (
                <div>
                  <MarkdownText text={content} />
                  {status === "streaming" && (
                    <span className="inline-block w-2 h-4 bg-[#7C3AED] animate-pulse ml-1 rounded-sm" />
                  )}
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="w-12 h-12 bg-[#EF4444]/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">Erro na análise</p>
                    <p className="text-[#94A3B8] text-sm max-w-md">{content}</p>
                  </div>
                  <Button
                    onClick={handleRetry}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            {status === "done" && (
              <div className="px-6 py-3 border-t border-[#1E293B] shrink-0 flex items-center justify-between">
                <p className="text-[#334155] text-xs">
                  Análise gerada por IA — use como suporte à decisão, não como diagnóstico definitivo
                </p>
                <Button
                  onClick={handleRetry}
                  variant="ghost"
                  size="sm"
                  className="text-[#475569] hover:text-[#94A3B8] hover:bg-[#1E293B] cursor-pointer text-xs h-7"
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
