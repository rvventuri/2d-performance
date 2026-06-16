"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Assessment, METRIC_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STANDARD_METRICS = Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[];

export function AssessmentCard({
  assessment,
  index,
  total,
  metricLabels,
  expandAll = false,
}: {
  assessment: Assessment;
  index: number;
  total: number;
  metricLabels: Record<string, string>;
  expandAll?: boolean;
}) {
  const [open, setOpen] = useState(expandAll || index === total - 1);
  const isOpen = expandAll || open;
  const filledMetrics = STANDARD_METRICS.filter(
    (k) => assessment.metrics[k] !== null && assessment.metrics[k] !== undefined
  );
  const customEntries = Object.entries(assessment.customMetrics ?? {}).filter(([, v]) => v !== null);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {expandAll ? (
        <div className="w-full flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
            <span className="font-heading font-bold text-foreground">
              Avaliação {index + 1}
            </span>
            <span className="text-muted-foreground text-sm">{formatDate(assessment.date)}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {filledMetrics.length + customEntries.length} métricas
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
            <span className="font-heading font-bold text-foreground">
              Avaliação {index + 1}
            </span>
            <span className="text-muted-foreground text-sm">{formatDate(assessment.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filledMetrics.length + customEntries.length} métricas
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>
      )}
      {isOpen && (
        <div className="px-5 pb-5 space-y-2">
          {filledMetrics.map((key) => (
            <div
              key={key}
              className="flex justify-between items-center py-1.5 border-b border-border last:border-0"
            >
              <span className="text-muted-foreground text-sm">{METRIC_LABELS[key]}</span>
              <span className="font-mono font-bold text-foreground text-sm">
                {assessment.metrics[key]}
              </span>
            </div>
          ))}
          {customEntries.map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between items-center py-1.5 border-b border-border last:border-0"
            >
              <span className="text-muted-foreground text-sm">{metricLabels[k] ?? k}</span>
              <span className="font-mono font-bold text-foreground text-sm">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
