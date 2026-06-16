"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Assessment } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";

interface MetricChartProps {
  assessments: Assessment[];
  metricKey: string;
  label: string;
  unit: string;
  color?: string;
  /** If true, reads from assessment.customMetrics; otherwise from assessment.metrics */
  isCustom?: boolean;
  goalValue?: number;
  higherIsBetter?: boolean;
  /** If false, the label/value header is hidden (parent handles it) */
  showHeader?: boolean;
  /** If false, disables line animation (useful for PDF export) */
  animate?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-secondary border border-border rounded-lg p-3 shadow-xl">
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <p className="text-foreground font-heading text-xl font-bold">
          {payload[0].value.toFixed(2)}
          {unit && <span className="text-muted-foreground text-sm ml-1">{unit}</span>}
        </p>
      </div>
    );
  }
  return null;
};

export default function MetricChart({
  assessments,
  metricKey,
  label,
  unit,
  color = "#6366f1",
  isCustom = false,
  goalValue,
  higherIsBetter = true,
  showHeader = true,
  animate = true,
}: MetricChartProps) {
  const getValue = (a: Assessment): number | null => {
    if (isCustom) {
      return (a.customMetrics ?? {})[metricKey] ?? null;
    }
    return (a.metrics as unknown as Record<string, number | null>)[metricKey] ?? null;
  };

  const data = assessments
    .filter((a) => getValue(a) !== null)
    .map((a) => ({
      date: formatDateShort(a.date),
      value: getValue(a) as number,
    }));

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
        Sem dados para {label}
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const latestValue = values[values.length - 1];
  const goalReached =
    goalValue !== undefined &&
    (higherIsBetter ? latestValue >= goalValue : latestValue <= goalValue);
  const goalColor = goalReached ? "#22c55e" : "#f59e0b";

  const domainMin = goalValue !== undefined
    ? Math.min(min, goalValue) * 0.93
    : min * 0.95;
  const domainMax = goalValue !== undefined
    ? Math.max(max, goalValue) * 1.07
    : max * 1.05;

  return (
    <div>
      {showHeader && (
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{label}</span>
          <span className="font-heading text-2xl font-bold text-foreground">
            {values[values.length - 1].toFixed(1)}
            {unit && <span className="text-muted-foreground text-sm ml-1">{unit}</span>}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 5, right: goalValue !== undefined ? 45 : 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {data.length > 1 && (
            <ReferenceLine
              y={avg}
              stroke="var(--border)"
              strokeDasharray="4 4"
              label={{ value: "avg", position: "right", fill: "var(--muted-foreground)", fontSize: 10 }}
            />
          )}
          {goalValue !== undefined && (
            <ReferenceLine
              y={goalValue}
              stroke={goalColor}
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `meta: ${goalValue}`,
                position: "right",
                fill: goalColor,
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            isAnimationActive={animate}
            dot={{ fill: color, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
      {data.length > 1 && (
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span>Min: <span className="text-foreground">{min.toFixed(1)}{unit}</span></span>
          <span>Máx: <span className="text-foreground">{max.toFixed(1)}{unit}</span></span>
          <span>Média: <span className="text-foreground">{avg.toFixed(1)}{unit}</span></span>
        </div>
      )}
    </div>
  );
}
