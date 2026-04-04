import { AnalysisInsight } from "@/lib/analysis";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface AnalysisInsightsProps {
  insights: AnalysisInsight[];
}

const icons = {
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const colors = {
  warning: {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    icon: "text-destructive",
    title: "text-destructive",
  },
  success: {
    bg: "bg-brand-primary/15",
    border: "border-brand-primary-bright/30",
    icon: "text-brand-accent",
    title: "text-brand-accent-glow",
  },
  info: {
    bg: "bg-brand-primary/10",
    border: "border-brand-primary-bright/25",
    icon: "text-brand-primary-bright",
    title: "text-brand-primary-bright",
  },
};

export default function AnalysisInsights({ insights }: AnalysisInsightsProps) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Insira mais dados para gerar insights automáticos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => {
        const Icon = icons[insight.type];
        const style = colors[insight.type];
        return (
          <div
            key={i}
            className={`${style.bg} border ${style.border} rounded-xl p-4 flex gap-3`}
          >
            <Icon className={`w-5 h-5 ${style.icon} shrink-0 mt-0.5`} />
            <div>
              <p className={`font-heading font-bold text-sm ${style.title} mb-0.5`}>
                {insight.title}
              </p>
              <p className="text-foreground/80 text-sm leading-relaxed">{insight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
