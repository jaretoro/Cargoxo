"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function CargoDemandChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d8d0c1" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#6b6257" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#6b6257" }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#8f4d1c" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
