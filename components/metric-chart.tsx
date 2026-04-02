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
import { Assessment, Metrics, METRIC_LABELS, METRIC_UNITS } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";

interface MetricChartProps {
  assessments: Assessment[];
  metricKey: keyof Metrics;
  color?: string;
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
      <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 shadow-xl">
        <p className="text-[#94A3B8] text-xs mb-1">{label}</p>
        <p className="text-white font-heading text-xl font-bold">
          {payload[0].value.toFixed(2)}
          {unit && <span className="text-[#94A3B8] text-sm ml-1">{unit}</span>}
        </p>
      </div>
    );
  }
  return null;
};

export default function MetricChart({ assessments, metricKey, color = "#22C55E" }: MetricChartProps) {
  const data = assessments
    .filter((a) => a.metrics[metricKey] !== null)
    .map((a) => ({
      date: formatDateShort(a.date),
      value: a.metrics[metricKey] as number,
    }));

  const unit = METRIC_UNITS[metricKey];
  const label = METRIC_LABELS[metricKey];

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-[#475569] text-sm">
        Sem dados para {label}
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium">{label}</span>
        <span className="font-heading text-2xl font-bold text-white">
          {values[values.length - 1].toFixed(1)}
          {unit && <span className="text-[#94A3B8] text-sm ml-1">{unit}</span>}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#475569", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[min * 0.95, max * 1.05]}
            tick={{ fill: "#475569", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {data.length > 1 && (
            <ReferenceLine
              y={avg}
              stroke="#334155"
              strokeDasharray="4 4"
              label={{ value: "avg", position: "right", fill: "#475569", fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
      {data.length > 1 && (
        <div className="flex gap-4 mt-2 text-xs text-[#475569]">
          <span>Min: <span className="text-[#94A3B8]">{min.toFixed(1)}{unit}</span></span>
          <span>Máx: <span className="text-[#94A3B8]">{max.toFixed(1)}{unit}</span></span>
          <span>Média: <span className="text-[#94A3B8]">{avg.toFixed(1)}{unit}</span></span>
        </div>
      )}
    </div>
  );
}
