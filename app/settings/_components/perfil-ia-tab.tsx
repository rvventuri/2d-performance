"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Brain } from "lucide-react";
import { toast } from "sonner";
import { TrainerProfile } from "@/lib/types";
import { saveTrainerProfile, invalidateAllAnalyses } from "../_actions";

interface Props {
  initialProfile: Omit<TrainerProfile, "id" | "userId" | "updatedAt"> | null;
}

const FIELDS = [
  {
    key: "coachingPhilosophy" as const,
    label: "Filosofia e Metodologia de Treinamento",
    placeholder:
      "Ex: Trabalho com periodização ondulatória, priorizando força reativa e ciência do movimento. Minha abordagem é baseada em dados e individualização...",
    rows: 4,
  },
  {
    key: "sportContext" as const,
    label: "Esporte / Contexto Principal",
    placeholder:
      "Ex: Futebol profissional e semiprofissional, com foco em jogadores de campo. Também atendo atletas de futvolei de alto rendimento...",
    rows: 3,
  },
  {
    key: "athleteProfiles" as const,
    label: "Perfil Típico dos Atletas Atendidos",
    placeholder:
      "Ex: Atletas entre 18-32 anos, amadores e semiprofissionais. A maioria tem histórico de 2+ anos de treinamento estruturado...",
    rows: 3,
  },
  {
    key: "priorityFocus" as const,
    label: "Foco Prioritário na Análise",
    placeholder:
      "Ex: Priorizo força reativa (RSI) e controle de assimetria. Para atletas com objetivo de velocidade, o tempo de contato é mais importante que o CMJ...",
    rows: 3,
  },
  {
    key: "customInstructions" as const,
    label: "Instruções Personalizadas para a IA",
    placeholder:
      "Ex: Sempre compare com referências de atletas de futvolei quando o contexto for beach. Mencione o ratio CMJ/SJ ao avaliar ciclo elástico...",
    rows: 3,
  },
] as const;

export function PerfilIaTab({ initialProfile }: Props) {
  const [form, setForm] = useState({
    coachingPhilosophy: initialProfile?.coachingPhilosophy ?? "",
    sportContext: initialProfile?.sportContext ?? "",
    athleteProfiles: initialProfile?.athleteProfiles ?? "",
    priorityFocus: initialProfile?.priorityFocus ?? "",
    customInstructions: initialProfile?.customInstructions ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveTrainerProfile(form);
      if (!result.ok) throw new Error(result.error);
      await invalidateAllAnalyses();
      toast.success("Perfil salvo! As análises existentes serão regeneradas.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-start gap-3 bg-brand-blue-mid/10 border border-brand-blue-mid/30 rounded-xl p-4">
        <Brain className="w-5 h-5 text-brand-blue-mid mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Estas informações são injetadas em todas as análises de IA. Quanto mais específico você for,
          mais alinhada ao seu método de trabalho será a análise dos seus atletas.
        </p>
      </div>

      {FIELDS.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            {field.label}
          </Label>
          <Textarea
            placeholder={field.placeholder}
            value={form[field.key]}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-brand-blue-light resize-none"
            rows={field.rows}
          />
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-blue-mid hover:bg-brand-blue-dark text-white font-bold cursor-pointer h-11 px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Perfil"}
        </Button>
      </div>
    </div>
  );
}
