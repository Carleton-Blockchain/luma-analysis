import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  tooltip?: string;
  breakdown?: Array<{ event: string; count: string | number }>;
}

export const StatCard = ({
  label,
  value,
  trend,
  icon,
  breakdown,
}: StatCardProps) => {
  return (
    <div className="stat-card relative group">
      <div className="flex justify-between items-start mb-2">
        <span className="stat-label">{label}</span>
        {icon && <div>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="stat-value">{value}</span>
        {trend !== undefined && (
          <span
            className={`flex items-center text-sm font-medium ${
              trend >= 0 ? "trend-positive" : "trend-negative"
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpIcon size={16} />
            ) : (
              <ArrowDownIcon size={16} />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="absolute z-10 invisible group-hover:visible bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 min-w-[200px] mt-2">
          {breakdown.map((item, index) => (
            <div key={index} className="flex justify-between py-1">
              <span className="text-sm">{item.event}</span>
              <span className="text-sm font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
