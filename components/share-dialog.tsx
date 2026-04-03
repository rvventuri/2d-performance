"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Lock, Globe, Copy, Check, Trash2,
  Loader2, Share2, RefreshCw, Link2,
} from "lucide-react";
import { toast } from "sonner";

interface ShareLinkMeta {
  token: string;
  url: string;
  hasPassword: boolean;
  createdAt: string;
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function ShareDialog({ open, onClose, studentId, studentName }: ShareDialogProps) {
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [existing, setExisting]     = useState<ShareLinkMeta | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [withPassword, setWithPassword] = useState(false);
  const [password, setPassword]     = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setPassword("");
    setCreatingNew(false);
    fetch(`/api/share?studentId=${studentId}`)
      .then((r) => r.json())
      .then((res) => {
        const link = res?.data ?? null;
        setExisting(link);
        if (!link) setCreatingNew(true);
      })
      .catch(() => { setExisting(null); setCreatingNew(true); })
      .finally(() => setLoading(false));
  }, [open, studentId]);

  const handleGenerate = async () => {
    if (withPassword && !password.trim()) { toast.error("Digite uma senha"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, ...(withPassword && password.trim() ? { password: password.trim() } : {}) }),
      });
      const res2 = await res.json();
      if (!res.ok) throw new Error(res2.error ?? "Erro ao gerar link");
      setExisting(res2.data ?? null);
      setCreatingNew(false);
      setPassword("");
      toast.success("Link gerado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar link");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await fetch(`/api/share?studentId=${studentId}`, { method: "DELETE" });
      setExisting(null); setCreatingNew(true); setWithPassword(false); setPassword("");
      toast.success("Acesso revogado");
    } catch { toast.error("Erro ao revogar"); }
    finally { setRevoking(false); }
  };

  const handleCopy = async () => {
    if (!existing?.url) return;
    await navigator.clipboard.writeText(existing.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border border-border text-foreground p-0 overflow-hidden sm:max-w-lg">
        <div className="p-5 w-full box-border">

          {/* Header */}
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Share2 className="w-4 h-4 text-brand-blue-light shrink-0" />
              Compartilhar com atleta
            </DialogTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Link para <span className="text-foreground font-medium">{studentName}</span> acompanhar
              a evolução sem precisar de conta.
            </p>
          </DialogHeader>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-brand-blue-light" />
            </div>
          )}

          {/* Link existente */}
          {!loading && existing && !creatingNew && (
            <div className="space-y-3">
              {/* Badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                existing.hasPassword
                  ? "bg-brand-yellow/10 text-brand-yellow"
                  : "bg-[#22C55E]/10 text-[#22C55E]"
              }`}>
                {existing.hasPassword
                  ? <><Lock className="w-3 h-3" />Protegido com senha</>
                  : <><Globe className="w-3 h-3" />Link público</>}
              </span>

              {/* URL */}
              <div className="w-full rounded-lg bg-secondary border border-border px-3 py-2.5">
                <p className="text-xs font-mono text-muted-foreground truncate">
                  {existing.url}
                </p>
              </div>

              {/* Botão copiar */}
              <button
                type="button"
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  copied
                    ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {copied ? <><Check className="w-4 h-4" />Copiado!</> : <><Copy className="w-4 h-4" />Copiar link</>}
              </button>

              <p className="text-muted-foreground text-xs">
                Criado em {new Date(existing.createdAt).toLocaleDateString("pt-BR")}
              </p>

              {/* Ações */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setCreatingNew(true); setWithPassword(existing.hasPassword); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  Novo link
                </button>
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 shrink-0" />}
                  Revogar
                </button>
              </div>
            </div>
          )}

          {/* Criação de link */}
          {!loading && creatingNew && (
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex gap-2">
                {[
                  { value: false, icon: Globe, label: "Público",   active: "bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E]" },
                  { value: true,  icon: Lock,  label: "Com senha", active: "bg-brand-yellow/10 border-brand-yellow/40 text-brand-yellow" },
                ].map(({ value, icon: Icon, label, active }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setWithPassword(value); if (!value) setPassword(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      withPassword === value
                        ? active
                        : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Campo senha */}
              {withPassword ? (
                <div className="space-y-1.5">
                  <label htmlFor="share-pw" className="block text-xs font-medium text-muted-foreground">
                    Senha de acesso
                  </label>
                  <input
                    id="share-pw"
                    type="password"
                    placeholder="Crie uma senha para o atleta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-yellow"
                  />
                </div>
              ) : (
                <p className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2.5">
                  <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#22C55E]" />
                  Qualquer pessoa com o link poderá ver os dados do atleta.
                </p>
              )}

              {/* Botão gerar */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-blue-mid hover:bg-brand-blue-dark text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-60"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</>
                  : <><Share2 className="w-4 h-4" />Gerar link</>}
              </button>

              {existing && (
                <button
                  type="button"
                  onClick={() => setCreatingNew(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer pt-1"
                >
                  Cancelar
                </button>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
