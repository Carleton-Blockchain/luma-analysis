import { Users, UserCheck, UserPlus, Repeat, Clock } from "lucide-react";
import { StatCard } from "@/components/statsCard";
import { attendee, attendeeHistory } from "@/types/users";

interface StatsCardsWidgetProps {
  RSVPs: attendee[];
  attendees: attendee[];
  rsvpsByEvent: Record<string, attendee[]>;
  attendeesByEvent: Record<string, attendee[]>;
  totalNewMembers: number;
  totalRecurringMembers: number;
  attendanceStats: {
    averageTime: string;
    earliestTime: string;
    latestTime: string;
  };
  punctualityStats: {
    onTime: number;
    late: number;
  };
}

export function StatsCardsWidget({
  RSVPs,
  attendees,
  rsvpsByEvent,
  attendeesByEvent,
  totalNewMembers,
  totalRecurringMembers,
  attendanceStats,
  punctualityStats,
}: StatsCardsWidgetProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        label="Total RSVPs"
        value={RSVPs.length.toString()}
        trend={0}
        icon={<Users size={20} />}
        tooltip="Total number of people who RSVP'd across all events"
        breakdown={Object.entries(rsvpsByEvent).map(([event, rsvps]) => ({
          event,
          count: rsvps.length,
        }))}
      />
      <StatCard
        label="Total Check-ins"
        value={attendees.length.toString()}
        trend={0}
        icon={<UserCheck size={20} />}
        tooltip="Total number of people who actually attended across all events"
        breakdown={Object.entries(attendeesByEvent).map(
          ([event, attendees]) => ({
            event,
            count: attendees.length,
          })
        )}
      />
      <StatCard
        label="RSVP:Check-ins"
        value={`${((attendees.length / RSVPs.length) * 100).toFixed(2)}%`}
        trend={0}
        icon={<UserPlus size={20} />}
        tooltip="Percentage of RSVPs who actually attended (total check-ins divided by total RSVPs)"
        breakdown={Object.entries(rsvpsByEvent).map(([event, rsvps]) => ({
          event,
          count: `${(
            (attendeesByEvent[event].length / rsvps.length) *
            100
          ).toFixed(2)}%`,
        }))}
      />
      <StatCard
        label="Return Rate"
        value={`${((totalRecurringMembers / attendees.length) * 100).toFixed(
          2
        )}%`}
        trend={0}
        icon={<Repeat size={20} />}
        tooltip="Percentage of attendees who came to multiple events"
      />
      <StatCard
        label="Recurring Members"
        value={totalRecurringMembers.toString()}
        trend={0}
        icon={<Repeat size={20} />}
        tooltip="Number of attendees who have attended multiple events"
      />
      <StatCard
        label="Average Check-in Time"
        value={attendanceStats.averageTime || "N/A"}
        trend={0}
        icon={<Clock size={20} />}
        tooltip="Average time when attendees checked in across all events"
        breakdown={[
          { event: "Earliest", count: attendanceStats.earliestTime },
          { event: "Latest", count: attendanceStats.latestTime },
        ]}
      />
      <StatCard
        label="On Time Attendance"
        value={`${((punctualityStats.onTime / attendees.length) * 100).toFixed(
          0
        )}%`}
        trend={0}
        icon={<Clock size={20} />}
        tooltip="Percentage of attendees who arrived before 6:15 PM"
        breakdown={[
          { event: "On Time", count: punctualityStats.onTime },
          { event: "Late", count: punctualityStats.late },
        ]}
      />
    </div>
  );
}
