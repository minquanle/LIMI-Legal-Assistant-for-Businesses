'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Horizontal layout (categories on the Y axis) instead of vertical bars with
// an X-axis category row: with 8+ document-type labels, a vertical bar chart
// has no room to show every tick on narrow viewports, so Recharts silently
// drops most of them (only 2 of 8 survived at 375px). Category text reads
// top-to-bottom here instead, so every label stays visible regardless of
// screen width, and long labels get more horizontal room to fit in one line.
export default function DocumentTypeBarChart({ data }: { data: any[] }) {
  const height = Math.max(320, data.length * 44);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 8, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
