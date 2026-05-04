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
import { formatDateShort } from "@/lib/utils";

interface ProgressData {
  date: string;
  overall: number;
  techniek?: number;
  fysiek?: number;
  tactiek?: number;
  mentaal?: number;
  teamplay?: number;
}

interface ProgressLineChartProps {
  data: ProgressData[];
  showCategories?: boolean;
  height?: number;
}

const CATEGORY_COLORS = {
  overall: "#4FA9E6",
  techniek: "#4FA9E6",
  fysiek: "#f59e0b",
  tactiek: "#ec4899",
  mentaal: "#ef4444",
  teamplay: "#84cc16",
};

export function ProgressLineChart({ data, showCategories = false, height = 200 }: ProgressLineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: formatDateShort(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[4, 10]}
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#0f172a",
            fontSize: "12px",
            boxShadow: "0 4px 12px rgba(15,23,42,0.1)",
          }}
          formatter={(value: number, name: string) => [value.toFixed(1), name]}
        />
        <Line
          type="monotone"
          dataKey="overall"
          stroke={CATEGORY_COLORS.overall}
          strokeWidth={2.5}
          dot={{ fill: CATEGORY_COLORS.overall, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: CATEGORY_COLORS.overall }}
          name="Overall"
        />
        {showCategories && Object.entries(CATEGORY_COLORS)
          .filter(([key]) => key !== "overall")
          .map(([key, color]) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name={key.charAt(0).toUpperCase() + key.slice(1)}
            />
          ))
        }
      </LineChart>
    </ResponsiveContainer>
  );
}
