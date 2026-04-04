"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingState } from "./DashboardClient";

const STORAGE_KEY = "saltoverse-onboarding-dismissed";
const DISMISS_EVENT = "saltoverse-onboarding-dismissed";

function subscribeOnboardingDismissed(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onStoreChange();
  };
  const onCustom = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(DISMISS_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DISMISS_EVENT, onCustom);
  };
}

function getOnboardingDismissedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getOnboardingDismissedServerSnapshot(): boolean {
  return false;
}

interface Step {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  action: string;
}

interface Props {
  state: OnboardingState;
}

export default function OnboardingChecklist({ state }: Props) {
  const dismissedFromStorage = useSyncExternalStore(
    subscribeOnboardingDismissed,
    getOnboardingDismissedSnapshot,
    getOnboardingDismissedServerSnapshot,
  );

  const steps: Step[] = [
    {
      id: "account",
      label: "Conta criada",
      description: "Você já está dentro da plataforma.",
      done: true,
      href: "/dashboard",
      action: "",
    },
    {
      id: "profile",
      label: "Configure o Perfil IA",
      description: "Ensine a IA sobre seu método e os atletas que você treina.",
      done: state.isProfileConfigured,
      href: "/settings",
      action: "Configurar",
    },
    {
      id: "student",
      label: "Cadastre seu primeiro atleta",
      description: "Adicione nome, idade, peso e objetivo do atleta.",
      done: state.hasStudents,
      href: "/students/new",
      action: "Cadastrar",
    },
    {
      id: "assessment",
      label: "Registre uma avaliação",
      description: "Insira os dados de salto para gerar a análise IA.",
      done: state.hasAssessments,
      href: state.firstStudentId
        ? `/students/${state.firstStudentId}/assessment/new`
        : "/students/new",
      action: "Registrar",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  if (dismissedFromStorage || allDone) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-8 relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 border border-brand-primary-bright/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-brand-primary-bright" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground leading-tight">
              Primeiros passos
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {completedCount} de {steps.length} concluídos
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          onClick={handleDismiss}
          title="Dispensar"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-5">
        <div
          className="h-full rounded-full bg-brand-primary transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              step.done
                ? "opacity-50"
                : "bg-secondary/40 hover:bg-secondary/70"
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-border shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium leading-tight ${
                  step.done
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {step.label}
              </p>
              {!step.done && (
                <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
                  {step.description}
                </p>
              )}
            </div>

            {!step.done && step.action && (
              <Link href={step.href} className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-border text-muted-foreground hover:text-brand-primary-bright hover:border-brand-primary-bright/40 cursor-pointer gap-1"
                >
                  {step.action}
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
