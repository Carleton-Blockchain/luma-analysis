"use client";
import { useEffect, useState } from "react";
import { attendee, attendeeHistory } from "@/types/users";
import { fetchAttendees, fetchRSVPs } from "@/db/event_queries";
import { getHistory } from "@/db/history_queries";
import { Users, UserCheck, UserPlus, Repeat, Clock } from "lucide-react";
import { StatCard } from "@/components/statsCard";
import { AttendanceChart } from "@/components/attendence";
import { GuestTypeChart } from "@/components/guestType";
import { CheckInDistribution } from "@/components/check-in-distribution";

export default function Home() {
  const [attendees, setAttendees] = useState<attendee[]>([]);
  const [RSVPs, setRSVPs] = useState<attendee[]>([]);
  const [missingAttendees, setMissingAttendees] = useState<attendee[]>([]);
  const [attendeeHistory, setAttendeeHistory] = useState<attendeeHistory[]>([]);
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
    Map<string, { new: number; recurring: number }>
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
          "Blockchain 101", // First event
          "Onchain Use Cases w Patrick", // Second event
          "Boba and Blockchains", // Third event
        ];

        const results = await Promise.all([
          fetchAttendees(events[0]),
          fetchRSVPs(events[0]),
          fetchAttendees(events[1]),
          fetchRSVPs(events[1]),
          fetchAttendees(events[2]),
          fetchRSVPs(events[2]),
          //getHistory(),
        ]);

        // Split results into attendees and RSVPs by event
        const attendeesByEvent: Record<string, attendee[]> = {};
        const rsvpsByEvent: Record<string, attendee[]> = {};

        events.forEach((event, index) => {
          const attendeeIndex = index * 2;
          const rsvpIndex = attendeeIndex + 1;

          attendeesByEvent[event] = results[attendeeIndex].map((row) => ({
            api_id: row.api_id,
            name: row.name,
            email: row.email,
            created_at: row.created_at,
            checked_in_at: row.checked_in_at,
          }));

          rsvpsByEvent[event] = results[rsvpIndex].map((row) => ({
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
          { new: number; recurring: number }
        >();

        // For the first event, all attendees are new
        const firstEvent = events[0];
        const firstEventAttendees = attendeesByEvent[firstEvent];
        eventStats.set(firstEvent, {
          new: firstEventAttendees.length,
          recurring: 0,
        });

        // For subsequent events, compare with previous event's attendees
        for (let i = 1; i < events.length; i++) {
          const currentEvent = events[i];
          const previousEvent = events[i - 1];
          const currentAttendees = attendeesByEvent[currentEvent];
          const previousAttendees = attendeesByEvent[previousEvent];

          const stats = {
            new: 0,
            recurring: 0,
          };

          // Check each current attendee
          currentAttendees.forEach((attendee) => {
            const wasInPreviousEvent = previousAttendees.some(
              (prevAttendee) => prevAttendee.api_id === attendee.api_id
            );
            if (wasInPreviousEvent) {
              stats.recurring++;
            } else {
              stats.new++;
            }
          });

          eventStats.set(currentEvent, stats);
        }

        // Calculate totals
        const totalNewMembers = Array.from(eventStats.values()).reduce(
          (sum, stats) => sum + stats.new,
          0
        );
        const totalRecurringMembers = Array.from(eventStats.values()).reduce(
          (sum, stats) => sum + stats.recurring,
          0
        );

        // After calculating eventStats, set it in state
        setEventStats(eventStats);

        setTotalNewMembers(totalNewMembers);
        setTotalRecurringMembers(totalRecurringMembers);

        // Calculate attendance time statistics
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

        // Calculate overall stats
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

        // Calculate per-event stats
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

        console.log("Earliest time:", overallStats.earliestTime);
        console.log("Latest time:", overallStats.latestTime);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Total RSVPs"
                value={RSVPs.length.toString()}
                trend={0}
                icon={<Users size={20} />}
                tooltip="Total number of people who RSVP'd across all events"
                breakdown={Object.entries(rsvpsByEvent).map(
                  ([event, rsvps]) => ({
                    event,
                    count: rsvps.length,
                  })
                )}
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
                value={`${((attendees.length / RSVPs.length) * 100).toFixed(
                  2
                )}%`}
                trend={0}
                icon={<UserPlus size={20} />}
                tooltip="Percentage of RSVPs who actually attended (total check-ins divided by total RSVPs)"
                breakdown={Object.entries(rsvpsByEvent).map(
                  ([event, rsvps]) => ({
                    event,
                    count: `${(
                      (attendeesByEvent[event].length / rsvps.length) *
                      100
                    ).toFixed(2)}%`,
                  })
                )}
              />
              <StatCard
                label="Return Rate"
                value={`0`}
                trend={0}
                icon={<Repeat size={20} />}
                tooltip="Percentage of attendees who came to multiple events"
              />
              <StatCard
                label="New Members"
                value={totalNewMembers.toString()}
                trend={0}
                icon={<UserPlus size={20} />}
                tooltip="Number of first-time attendees across all events"
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
                value={`${(
                  (punctualityStats.onTime / attendees.length) *
                  100
                ).toFixed(0)}%`}
                trend={0}
                icon={<Clock size={20} />}
                tooltip="Percentage of attendees who arrived before 6:15 PM"
                breakdown={[
                  { event: "On Time", count: punctualityStats.onTime },
                  { event: "Late", count: punctualityStats.late },
                ]}
              />
            </div>

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
              <div key={event} className="mb-8 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {event}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <StatCard
                    label="Event RSVPs"
                    value={`${rsvps.length}`}
                    trend={0}
                    icon={<Users size={20} />}
                    tooltip={`${rsvps.length} total RSVPs with ${(
                      (attendeesByEvent[event].length / rsvps.length) *
                      100
                    ).toFixed(0)}% attendance rate`}
                  />
                  <StatCard
                    label="Event Check-ins"
                    value={attendeesByEvent[event].length.toString()}
                    trend={0}
                    icon={<UserCheck size={20} />}
                    tooltip={`Total number of attendees who checked in at ${event}`}
                  />
                  <StatCard
                    label="RSVP:Check-in Ratio"
                    value={`${(
                      (attendeesByEvent[event].length / rsvps.length) *
                      100
                    ).toFixed(2)}%`}
                    trend={0}
                    icon={<UserPlus size={20} />}
                    tooltip={`Percentage of RSVPs who actually attended ${event}`}
                  />
                  <StatCard
                    label="New Members"
                    value={eventStats.get(event)?.new.toString() || "0"}
                    trend={0}
                    icon={<UserPlus size={20} />}
                    tooltip={`Number of first-time attendees at ${event}`}
                  />
                  <StatCard
                    label="Recurring Members"
                    value={eventStats.get(event)?.recurring.toString() || "0"}
                    trend={0}
                    icon={<Repeat size={20} />}
                    tooltip={`Number of attendees at ${event} who had attended previous events`}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mt-6">
                  <StatCard
                    label="Check-in Times"
                    value={attendanceStats.byEvent[event]?.averageTime || "N/A"}
                    trend={0}
                    icon={<Clock size={20} />}
                    tooltip={`Average check-in time for ${event}`}
                    breakdown={[
                      {
                        event: "Earliest",
                        count:
                          attendanceStats.byEvent[event]?.earliestTime || "N/A",
                      },
                      {
                        event: "Latest",
                        count:
                          attendanceStats.byEvent[event]?.latestTime || "N/A",
                      },
                    ]}
                  />
                  <StatCard
                    label="Punctuality"
                    value={`${(
                      (punctualityStats.byEvent[event]?.onTime /
                        attendeesByEvent[event].length) *
                      100
                    ).toFixed(0)}%`}
                    trend={0}
                    icon={<Clock size={20} />}
                    tooltip={`Percentage of attendees who arrived before 6:15 PM at ${event}`}
                    breakdown={[
                      {
                        event: "On Time",
                        count: punctualityStats.byEvent[event]?.onTime || 0,
                      },
                      {
                        event: "Late",
                        count: punctualityStats.byEvent[event]?.late || 0,
                      },
                    ]}
                  />
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Check-in Distribution
                  </h3>
                  <CheckInDistribution data={timeDistributionByEvent[event]} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
