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
    bg: "bg-[#EF4444]/10",
    border: "border-[#EF4444]/30",
    icon: "text-[#EF4444]",
    title: "text-[#FCA5A5]",
  },
  success: {
    bg: "bg-[#22C55E]/10",
    border: "border-[#22C55E]/30",
    icon: "text-[#22C55E]",
    title: "text-[#86EFAC]",
  },
  info: {
    bg: "bg-[#3B82F6]/10",
    border: "border-[#3B82F6]/30",
    icon: "text-[#3B82F6]",
    title: "text-[#93C5FD]",
  },
};

export default function AnalysisInsights({ insights }: AnalysisInsightsProps) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-[#475569] text-sm">
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
              <p className="text-[#CBD5E1] text-sm leading-relaxed">{insight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
