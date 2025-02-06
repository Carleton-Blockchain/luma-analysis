import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// Define the type for our data structure
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
  colors = ["#2563eb", "#64748b"], // Default colors if none provided
}: GuestTypeChartProps) => {
  return (
    <div className="h-[300px] w-full bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Guest Breakdown</h3>
      <ResponsiveContainer width="100%" height="100%">
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
