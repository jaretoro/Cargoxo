"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export function MrrTrendChart({ data }: { data: { month: string; mrr: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
        <defs>
          <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8f4d1c" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#8f4d1c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b6257" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#6b6257" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "MRR"]} />
        <Area type="monotone" dataKey="mrr" stroke="#17222e" strokeWidth={2.5} fill="url(#mrrFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VerificationGauge({ rate }: { rate: number }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={16} data={[{ value: rate, fill: "#2c5e3f" }]} startAngle={210} endAngle={-30}>
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background dataKey="value" cornerRadius={8} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
