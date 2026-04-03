"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  month: string;
  count: number;
}

interface Props {
  data: DataPoint[];
}

export default function SignupsChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={24}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            color: "hsl(var(--foreground))",
          }}
          cursor={{ fill: "hsl(var(--accent))" }}
          formatter={(value) => [Number(value), "Cadastros"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.count === max ? "#2E5BFF" : "#1437C91a"}
              stroke={entry.count === max ? "#2E5BFF" : "#1437C9"}
              strokeWidth={1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
