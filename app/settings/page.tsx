import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupabaseTrainerProfileRepository } from "@/infrastructure/supabase/TrainerProfileRepository";
import { SupabaseMetricConfigRepository } from "@/infrastructure/supabase/MetricConfigRepository";
import { GetTrainerConfigUseCase } from "@/application/trainer/GetTrainerConfigUseCase";
import { PerfilIaTab } from "./_components/perfil-ia-tab";
import { MetricasTab } from "./_components/metricas-tab";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const useCase = new GetTrainerConfigUseCase(
    new SupabaseTrainerProfileRepository(supabase, user.id),
    new SupabaseMetricConfigRepository(supabase, user.id)
  );

  const [profile, configs] = await Promise.all([
    new SupabaseTrainerProfileRepository(supabase, user.id).getByUserId(user.id),
    new SupabaseMetricConfigRepository(supabase, user.id).getByUserId(user.id),
  ]);

  const { resolvedMetrics } = await useCase.execute(user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-foreground tracking-wide mb-1">
          CONFIGURAÇÕES
        </h1>
        <p className="text-muted-foreground text-sm">
          Personalize como a IA analisa seus atletas — cada treinador tem seu próprio modelo.
        </p>
      </div>

      <Tabs defaultValue="perfil-ia">
        <TabsList className="bg-card border border-border p-1 rounded-xl mb-6">
          <TabsTrigger
            value="perfil-ia"
            className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-muted-foreground rounded-lg"
          >
            Perfil IA
          </TabsTrigger>
          <TabsTrigger
            value="metricas"
            className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-muted-foreground rounded-lg"
          >
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil-ia">
          <PerfilIaTab
            initialProfile={
              profile
                ? {
                    coachingPhilosophy: profile.coachingPhilosophy,
                    sportContext: profile.sportContext,
                    athleteProfiles: profile.athleteProfiles,
                    priorityFocus: profile.priorityFocus,
                    customInstructions: profile.customInstructions,
                  }
                : null
            }
          />
        </TabsContent>

        <TabsContent value="metricas">
          <MetricasTab initialConfigs={configs} resolvedMetrics={resolvedMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
