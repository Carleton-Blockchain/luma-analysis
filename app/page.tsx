"use client";
import { useEffect, useState } from "react";
import { attendee, attendeeHistory } from "@/types/users";
import { fetchAttendees, fetchRSVPs } from "@/db/event_queries";
import { AttendanceChart } from "@/components/attendence";
import { GuestTypeChart } from "@/components/guestType";
import { StatsCardsWidget } from "@/components/StatsCardsWidget";
import { EventStatsWidget } from "@/components/EventStatsWidget";
import { getRecurring } from "@/db/recurring_queries";

export default function Home() {
  const [attendees, setAttendees] = useState<attendee[]>([]);
  const [RSVPs, setRSVPs] = useState<attendee[]>([]);
  const [missingAttendees, setMissingAttendees] = useState<attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendeesByEvent, setAttendeesByEvent] = useState<
    Record<string, attendee[]>
  >({});
  const [rsvpsByEvent, setRsvpsByEvent] = useState<Record<string, attendee[]>>(
    {}
  );
  const [totalNewMembers, setTotalNewMembers] = useState(0);
  const [totalRecurringMembers, setTotalRecurringMembers] = useState(0);
  const [eventStats, setEventStats] = useState<
    Map<
      string,
      { new: number; recurring: number; recurringDetails?: attendee[] }
    >
  >(new Map());
  const [attendanceStats, setAttendanceStats] = useState<{
    averageTime: string;
    earliestTime: string;
    latestTime: string;
    byEvent: Record<
      string,
      {
        averageTime: string;
        earliestTime: string;
        latestTime: string;
      }
    >;
  }>({
    averageTime: "",
    earliestTime: "",
    latestTime: "",
    byEvent: {},
  });
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>(
    []
  );
  const [timeDistributionByEvent, setTimeDistributionByEvent] = useState<
    Record<string, TimeDistribution[]>
  >({});
  const [punctualityStats, setPunctualityStats] = useState<{
    onTime: number;
    late: number;
    byEvent: Record<string, { onTime: number; late: number }>;
  }>({
    onTime: 0,
    late: 0,
    byEvent: {},
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const events = [
          "Boba and Blockchains", // Newest (index 0)
          "Onchain Use Cases w Patrick", // Middle (index 1)
          "Blockchain 101", // Oldest (index 2)
        ];

        const results = await Promise.all([
          fetchAttendees(events[0]),
          fetchRSVPs(events[0]),
          fetchAttendees(events[1]),
          fetchRSVPs(events[1]),
          fetchAttendees(events[2]),
          fetchRSVPs(events[2]),
          getRecurring(events[2], []), // Blockchain 101 - first event, no previous events
          getRecurring(events[1], [events[2]]), // Onchain - check against Blockchain 101
          getRecurring(events[0], [events[1], events[2]]), // Boba - check against both previous
        ]);

        console.log(results[6]);
        console.log(results[7]);
        console.log(results[8]);

        const attendeesByEvent: Record<string, attendee[]> = {};
        const rsvpsByEvent: Record<string, attendee[]> = {};

        events.forEach((event, index) => {
          const attendeeIndex = index * 2;
          const rsvpIndex = attendeeIndex + 1;

          attendeesByEvent[event] = results[attendeeIndex].map((row: any) => ({
            api_id: row.api_id,
            name: row.name,
            email: row.email,
            created_at: row.created_at,
            checked_in_at: row.checked_in_at,
          }));

          rsvpsByEvent[event] = results[rsvpIndex].map((row: any) => ({
            api_id: row.api_id,
            name: row.name,
            email: row.email,
            created_at: row.created_at,
            checked_in_at: null,
          }));
        });

        const allAttendees = Object.values(attendeesByEvent).flat();
        const allRSVPs = Object.values(rsvpsByEvent).flat();

        const missing = allRSVPs.filter(
          (rsvp) =>
            !allAttendees.some((attendee) => attendee.api_id === rsvp.api_id)
        );

        // Update state with the event-specific data
        setAttendeesByEvent(attendeesByEvent);
        setRsvpsByEvent(rsvpsByEvent);
        setAttendees(allAttendees);
        setRSVPs(allRSVPs);
        setMissingAttendees(missing);

        const eventStats = new Map<
          string,
          { new: number; recurring: number; recurringDetails?: attendee[] }
        >();

        // Process recurring data
        const recurringEvent1 = results[8]; // Boba - recurring from both previous events
        const recurringEvent2 = results[7]; // Onchain - recurring from Blockchain 101
        const recurringEvent3 = results[6]; // Blockchain 101 - first event, all new

        const recurringByEvent = {
          [events[0]]: recurringEvent1, // Boba and Blockchains
          [events[1]]: recurringEvent2, // Onchain Use Cases
          [events[2]]: recurringEvent3, // Blockchain 101
        };

        events.forEach((event, index) => {
          const currentAttendees = attendeesByEvent[event];
          const recurringAttendees = recurringByEvent[event];

          const stats = {
            new: currentAttendees.length - recurringAttendees.length,
            recurring: recurringAttendees.length,
            recurringDetails: recurringAttendees,
          };

          eventStats.set(event, stats);
        });

        const totalRecurringMembers = Array.from(eventStats.values()).reduce(
          (sum, stats) => sum + stats.recurring,
          0
        );

        setEventStats(eventStats);
        setTotalNewMembers(totalNewMembers);
        setTotalRecurringMembers(totalRecurringMembers);

        const calculateTimeStats = (checkinTimes: string[]) => {
          if (checkinTimes.length === 0) return null;

          const timesInMinutes = checkinTimes.map((time) => {
            const [timeStr, period] = time.split(" ");
            const [hours, minutes] = timeStr.split(":").map(Number);
            let totalMinutes = hours * 60 + minutes;
            if (period === "PM" && hours !== 12) totalMinutes += 12 * 60;
            if (period === "AM" && hours === 12) totalMinutes = minutes;
            return totalMinutes;
          });

          const avgMinutes = Math.round(
            timesInMinutes.reduce((a, b) => a + b, 0) / timesInMinutes.length
          );
          const earliest = Math.min(...timesInMinutes);
          const latest = Math.max(...timesInMinutes);

          const formatTime = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours % 12 || 12}:${mins.toString().padStart(2, "0")} ${
              hours >= 12 ? "PM" : "AM"
            }`;
          };

          return {
            averageTime: formatTime(avgMinutes),
            earliestTime: formatTime(earliest),
            latestTime: formatTime(latest),
          };
        };

        const allCheckinTimes = allAttendees
          .filter((attendee) => attendee.checked_in_at)
          .map((attendee) => {
            const date = new Date(attendee.checked_in_at!);
            return date.toLocaleString("en-US", {
              timeZone: "America/New_York",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            });
          });

        const overallStats = calculateTimeStats(allCheckinTimes) || {
          averageTime: "",
          earliestTime: "",
          latestTime: "",
        };

        const eventTimeStats: Record<
          string,
          { averageTime: string; earliestTime: string; latestTime: string }
        > = {};

        events.forEach((event) => {
          const eventCheckinTimes = attendeesByEvent[event]
            .filter((attendee) => attendee.checked_in_at)
            .map((attendee) => {
              const date = new Date(attendee.checked_in_at!);
              return date.toLocaleString("en-US", {
                timeZone: "America/New_York",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              });
            });

          eventTimeStats[event] = calculateTimeStats(eventCheckinTimes) || {
            averageTime: "N/A",
            earliestTime: "N/A",
            latestTime: "N/A",
          };
        });

        setAttendanceStats({
          ...overallStats,
          byEvent: eventTimeStats,
        });

        const getTimeDistribution = (attendees: attendee[]) => {
          const distribution: Record<string, number> = {};

          attendees
            .filter((a) => a.checked_in_at)
            .forEach((attendee) => {
              const date = new Date(attendee.checked_in_at!);
              const time = date.toLocaleString("en-US", {
                timeZone: "America/New_York",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              // Round to nearest 2 minutes
              const [timeStr, period] = time.split(" ");
              const [hours, minutes] = timeStr.split(":");
              const roundedMinutes = Math.floor(parseInt(minutes) / 2) * 2;
              const formattedTime = `${hours}:${roundedMinutes
                .toString()
                .padStart(2, "0")} ${period}`;

              distribution[formattedTime] =
                (distribution[formattedTime] || 0) + 1;
            });

          return Object.entries(distribution)
            .map(([time, count]) => ({ time, count }))
            .sort((a, b) => {
              const getTimeInMinutes = (time: string) => {
                const [timeStr, period] = time.split(" ");
                const [hours, minutes] = timeStr.split(":").map(Number);
                let totalMinutes = hours * 60 + minutes;
                if (period === "PM" && hours !== 12) totalMinutes += 12 * 60;
                if (period === "AM" && hours === 12) totalMinutes = minutes;
                return totalMinutes;
              };
              return getTimeInMinutes(a.time) - getTimeInMinutes(b.time);
            });
        };

        // Calculate time distribution for all attendees and for each event
        setTimeDistribution(getTimeDistribution(allAttendees));

        const distributionByEvent: Record<string, TimeDistribution[]> = {};
        events.forEach((event) => {
          distributionByEvent[event] = getTimeDistribution(
            attendeesByEvent[event]
          );
        });
        setTimeDistributionByEvent(distributionByEvent);

        // Calculate punctuality stats
        const calculatePunctuality = (attendees: attendee[]) => {
          const stats = {
            onTime: 0,
            late: 0,
          };

          attendees
            .filter((a) => a.checked_in_at)
            .forEach((attendee) => {
              const date = new Date(attendee.checked_in_at!);
              const time = date.toLocaleString("en-US", {
                timeZone: "America/New_York",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              const [timeStr, period] = time.split(" ");
              const [hours, minutes] = timeStr.split(":").map(Number);
              const totalMinutes =
                (hours % 12) * 60 + minutes + (period === "PM" ? 12 * 60 : 0);

              // 18:15 (6:15 PM) in minutes = 18 * 60 + 15 = 1095
              if (totalMinutes <= 1095) {
                stats.onTime++;
              } else {
                stats.late++;
              }
            });

          return stats;
        };

        // Calculate overall punctuality
        const overallPunctuality = calculatePunctuality(allAttendees);

        // Calculate per-event punctuality
        const eventPunctuality: Record<
          string,
          { onTime: number; late: number }
        > = {};
        events.forEach((event) => {
          eventPunctuality[event] = calculatePunctuality(
            attendeesByEvent[event]
          );
        });

        setPunctualityStats({
          ...overallPunctuality,
          byEvent: eventPunctuality,
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Carleton Blockchain Luma Analytics
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <StatsCardsWidget
              RSVPs={RSVPs}
              attendees={attendees}
              rsvpsByEvent={rsvpsByEvent}
              attendeesByEvent={attendeesByEvent}
              totalRecurringMembers={totalRecurringMembers}
              attendanceStats={attendanceStats}
              punctualityStats={punctualityStats}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GuestTypeChart
                data={[
                  { name: "All RSVPs", value: RSVPs.length },
                  { name: "All Checkins", value: attendees.length },
                ]}
              />
              <AttendanceChart />
            </div>

            {Object.entries(rsvpsByEvent).map(([event, rsvps]) => (
              <EventStatsWidget
                key={event}
                event={event}
                rsvps={rsvps}
                attendees={attendeesByEvent[event]}
                eventStats={eventStats.get(event)}
                attendanceStats={attendanceStats.byEvent[event]}
                punctualityStats={punctualityStats.byEvent[event]}
                timeDistribution={timeDistributionByEvent[event]}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
