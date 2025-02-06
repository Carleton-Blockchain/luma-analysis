import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Blockchain 101", rsvp: 53, attendance: 32 },
  { name: "Onchain Use Cases w Patrick", rsvp: 38, attendance: 21 },
  { name: "Boba and Blockchain", rsvp: 51, attendance: 34 },
];

export const AttendanceChart = () => {
  return (
    <div className="h-[300px] w-full bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Attendance Trends</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="rsvp"
            stroke="#2563eb"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="attendance"
            stroke="#64748b"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
