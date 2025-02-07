import { Users, UserCheck, UserPlus, Repeat, Clock } from "lucide-react";
import { CheckInDistribution } from "./check-in-distribution";
import { attendee } from "@/types/users";
import { StatCard } from "./statsCard";

interface EventStatsWidgetProps {
  event: string;
  rsvps: attendee[];
  attendees: attendee[];
  eventStats:
    | {
        new: number;
        recurring: number;
        recurringDetails: string[];
      }
    | undefined;
  attendanceStats: {
    averageTime: string;
    earliestTime: string;
    latestTime: string;
  };
  punctualityStats: { onTime: number; late: number };
  timeDistribution: Array<{ time: string; count: number }>;
}

export function EventStatsWidget({
  event,
  rsvps,
  attendees,
  eventStats,
  attendanceStats,
  punctualityStats,
  timeDistribution,
}: EventStatsWidgetProps) {
  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{event}</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard
          label="Event RSVPs"
          value={`${rsvps.length}`}
          trend={0}
          icon={<Users size={20} />}
          tooltip={`${rsvps.length} total RSVPs with ${(
            (attendees.length / rsvps.length) *
            100
          ).toFixed(0)}% attendance rate`}
        />
        <StatCard
          label="Event Check-ins"
          value={attendees.length.toString()}
          trend={0}
          icon={<UserCheck size={20} />}
          tooltip={`Total number of attendees who checked in at ${event}`}
        />
        <StatCard
          label="RSVP:Check-in Ratio"
          value={`${((attendees.length / rsvps.length) * 100).toFixed(2)}%`}
          trend={0}
          icon={<UserPlus size={20} />}
          tooltip={`Percentage of RSVPs who actually attended ${event}`}
        />
        <StatCard
          label="New Members"
          value={eventStats?.new.toString() || "0"}
          trend={0}
          icon={<UserPlus size={20} />}
          tooltip={`Number of first-time attendees at ${event}`}
        />
        <StatCard
          label="Recurring Members"
          value={eventStats?.recurring.toString() || "0"}
          trend={0}
          icon={<Repeat size={20} />}
          tooltip={`Number of attendees at ${event} who had attended previous events`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mt-6">
        <StatCard
          label="Check-in Times"
          value={attendanceStats?.averageTime || "N/A"}
          trend={0}
          icon={<Clock size={20} />}
          tooltip={`Average check-in time for ${event}`}
          breakdown={[
            {
              event: "Earliest",
              count: attendanceStats?.earliestTime || "N/A",
            },
            { event: "Latest", count: attendanceStats?.latestTime || "N/A" },
          ]}
        />
        <StatCard
          label="Punctuality"
          value={`${(
            (punctualityStats?.onTime / attendees.length) *
            100
          ).toFixed(0)}%`}
          trend={0}
          icon={<Clock size={20} />}
          tooltip={`Percentage of attendees who arrived before 6:15 PM at ${event}`}
          breakdown={[
            { event: "On Time", count: punctualityStats?.onTime || 0 },
            { event: "Late", count: punctualityStats?.late || 0 },
          ]}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Check-in Distribution
        </h3>
        <CheckInDistribution data={timeDistribution} />
      </div>
    </div>
  );
}
