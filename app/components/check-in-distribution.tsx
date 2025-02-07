import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TimeDistribution = {
  time: string; // Format: "HH:mm"
  count: number;
};

interface CheckInDistributionProps {
  data: TimeDistribution[];
}

export function CheckInDistribution({ data }: CheckInDistributionProps) {
  return (
    <div className="h-[300px] w-full bg-white rounded-xl p-6 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            interval={14}
            angle={-45}
            textAnchor="end"
            height={60}
            minTickGap={2}
          />
          <YAxis allowDecimals={false} />
          <Tooltip
            formatter={(value: number) => [`${value} check-ins`, "Count"]}
            labelFormatter={(label: string) => `Time: ${label}`}
          />
          <Bar dataKey="count" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
