import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}

export default function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="font-heading text-3xl font-bold text-foreground leading-none">
            {value}
          </p>
          {sub && (
            <p className="text-muted-foreground text-xs mt-1.5">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}
