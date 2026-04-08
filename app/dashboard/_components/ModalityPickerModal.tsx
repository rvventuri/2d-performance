"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { completeModalityOnboardingAction } from "../modality-actions";

export interface ModalityOption {
  id: string;
  title: string;
  description: string;
}

interface Props {
  open: boolean;
  options: ModalityOption[];
}

export function ModalityPickerModal({ open, options }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const busy = isPending || pendingId !== null;

  function selectModality(templateId: string) {
    setPendingId(templateId);
    startTransition(async () => {
      const result = await completeModalityOnboardingAction(templateId);
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.alreadyCompleted) {
        router.refresh();
        return;
      }
      toast.success(
        result.demoCloned
          ? "Modalidade definida e dados de demonstração carregados."
          : "Modalidade definida. Se não aparecerem alunos de demo, configure o usuário seed dessa modalidade no ambiente (AGENTS.md)."
      );
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg max-h-[min(90vh,640px)] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-accent-glow" aria-hidden />
            </div>
            <DialogTitle className="text-left font-heading text-lg">
              Qual modalidade você acompanha?
            </DialogTitle>
          </div>
          <DialogDescription className="text-left pt-1">
            Escolha uma opção para configurar suas métricas e, quando disponível, carregar alunos de
            demonstração alinhados a esse perfil. Você pode ajustar tudo depois em Configurações.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 pt-2">
          {options.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant="outline"
              disabled={busy}
              className="h-auto min-h-14 flex-col items-stretch gap-1 py-3 px-4 text-left border-border hover:border-brand-primary-bright/40 hover:bg-accent cursor-pointer whitespace-normal"
              onClick={() => selectModality(opt.id)}
            >
              <span className="font-semibold text-foreground w-full">{opt.title}</span>
              <span className="text-muted-foreground text-xs font-normal leading-snug w-full">
                {opt.description}
              </span>
              {pendingId === opt.id && (
                <span className="flex items-center gap-1.5 text-xs text-brand-primary-bright mt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Configurando…
                </span>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
