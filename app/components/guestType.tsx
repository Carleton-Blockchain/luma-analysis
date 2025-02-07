import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface GuestData {
  name: string;
  value: number;
}

interface GuestTypeChartProps {
  data: GuestData[];
  colors?: string[];
}

export const GuestTypeChart = ({
  data,
  colors = ["#2563eb", "#64748b"],
}: GuestTypeChartProps) => {
  return (
    <div
      style={{ height: "300px" }}
      className="w-full bg-white rounded-xl p-6 pb-16 shadow-sm mb-12"
    >
      <h3 className="text-lg font-semibold mb-4">Guest Breakdown</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
