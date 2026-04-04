import { MetricEvolution } from "@/lib/analysis";
import { Metrics, METRIC_LABELS, METRIC_UNITS } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EvolutionCardProps {
  evolutions: MetricEvolution[];
}

export default function EvolutionCard({ evolutions }: EvolutionCardProps) {
  const withData = evolutions.filter((e) => e.current !== null);

  if (withData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma métrica registrada nessa avaliação.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {withData.map((ev) => {
        const hasPrev = ev.previous !== null && ev.change !== null;
        const isPositive = (ev.changePercent ?? 0) > 0;
        const isNegative = (ev.changePercent ?? 0) < 0;
        const unit = METRIC_UNITS[ev.key as keyof Metrics];

        return (
          <div key={ev.key} className="bg-secondary rounded-xl p-4">
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium mb-2">
              {METRIC_LABELS[ev.key as keyof Metrics]}
            </p>
            <div className="flex items-end justify-between">
              <div>
                <span className="font-heading text-2xl font-bold text-foreground">
                  {ev.current?.toFixed(ev.key === "rsi" ? 2 : 1)}
                </span>
                {unit && <span className="text-muted-foreground text-sm ml-1">{unit}</span>}
                {hasPrev && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Anterior: {ev.previous?.toFixed(ev.key === "rsi" ? 2 : 1)}{unit}
                  </p>
                )}
              </div>
              {hasPrev && ev.changePercent !== null && (
                <div
                  className={`flex items-center gap-1 text-sm font-semibold rounded-lg px-2 py-1 ${
                    isPositive
                      ? "text-brand-primary-bright bg-brand-primary/15"
                      : isNegative
                      ? "text-destructive bg-destructive/10"
                      : "text-muted-foreground bg-muted-foreground/10"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : isNegative ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(ev.changePercent).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
