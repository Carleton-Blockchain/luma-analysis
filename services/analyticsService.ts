import { fetchAttendees, fetchRSVPs } from "@/db/event_queries";
import { getRecurring } from "@/db/recurring_queries";
import type { attendee } from "@/types/users";

export const EVENTS = [
  "Boba and Blockchains",
  "Onchain Use Cases w Patrick",
  "Blockchain 101",
] as const;

interface TimeStats {
  averageTime: string;
  earliestTime: string;
  latestTime: string;
}

export interface AnalyticsData {
  attendeesByEvent: Record<string, attendee[]>;
  rsvpsByEvent: Record<string, attendee[]>;
  allAttendees: attendee[];
  allRSVPs: attendee[];
  eventStats: Map<
    string,
    {
      new: number;
      recurring: number;
      recurringDetails: string[];
    }
  >;
  attendanceStats: {
    averageTime: string;
    earliestTime: string;
    latestTime: string;
    byEvent: Record<string, TimeStats>;
  };
  timeDistributionByEvent: Record<string, TimeDistribution[]>;
  punctualityStats: {
    onTime: number;
    late: number;
    byEvent: Record<string, { onTime: number; late: number }>;
  };
}

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  // Fetch all data in parallel
  const results = await Promise.all([
    fetchAttendees(EVENTS[0]),
    fetchRSVPs(EVENTS[0]),
    fetchAttendees(EVENTS[1]),
    fetchRSVPs(EVENTS[1]),
    fetchAttendees(EVENTS[2]),
    fetchRSVPs(EVENTS[2]),
    getRecurring(EVENTS[2], []),
    getRecurring(EVENTS[1], [EVENTS[2]]),
    getRecurring(EVENTS[0], [EVENTS[1], EVENTS[2]]),
  ]);

  // Process attendees and RSVPs by event
  const attendeesByEvent: Record<string, attendee[]> = {};
  const rsvpsByEvent: Record<string, attendee[]> = {};

  EVENTS.forEach((event, index) => {
    const attendeeIndex = index * 2;
    const rsvpIndex = attendeeIndex + 1;

    attendeesByEvent[event] = results[attendeeIndex].map(
      (row: any): attendee => ({
        api_id: row.api_id || null,
        name: row.name,
        email: row.email,
        created_at: row.created_at || row.c,
        checked_in_at: row.checked_in_at || null,
      })
    );

    rsvpsByEvent[event] = results[rsvpIndex].map((row: any) => ({
      api_id: row.api_id,
      name: row.name,
      email: row.email,
      created_at: row.created_at,
      checked_in_at: row.checked_in_at || null,
    }));
  });

  const allAttendees = Object.values(attendeesByEvent).flat();
  const allRSVPs = Object.values(rsvpsByEvent).flat();

  // Process event stats
  const eventStats = new Map();
  const recurringByEvent = {
    [EVENTS[0]]: results[8],
    [EVENTS[1]]: results[7],
    [EVENTS[2]]: results[6],
  };

  EVENTS.forEach((event) => {
    const currentAttendees = attendeesByEvent[event];
    const recurringAttendees = recurringByEvent[event];

    eventStats.set(event, {
      new: currentAttendees.length - recurringAttendees.length,
      recurring: recurringAttendees.length,
      recurringDetails: recurringAttendees.map(
        (attendee: any) => attendee.name
      ),
    });
  });

  // Calculate attendance stats
  const attendanceStats = calculateAttendanceStats(
    allAttendees,
    attendeesByEvent
  );

  // Calculate time distribution
  const timeDistributionByEvent = calculateTimeDistribution(attendeesByEvent);

  // Calculate punctuality stats
  const punctualityStats = calculatePunctualityStats(
    allAttendees,
    attendeesByEvent
  );

  return {
    attendeesByEvent,
    rsvpsByEvent,
    allAttendees,
    allRSVPs,
    eventStats,
    attendanceStats,
    timeDistributionByEvent,
    punctualityStats,
  };
}

function calculateAttendanceStats(
  allAttendees: attendee[],
  attendeesByEvent: Record<string, attendee[]>
) {
  const calculateTimeStats = (checkinTimes: string[]): TimeStats | null => {
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

    return {
      averageTime: formatTime(avgMinutes),
      earliestTime: formatTime(earliest),
      latestTime: formatTime(latest),
    };
  };

  const allCheckinTimes = getCheckinTimes(allAttendees);
  const overallStats = calculateTimeStats(allCheckinTimes) || {
    averageTime: "",
    earliestTime: "",
    latestTime: "",
  };

  const byEvent: Record<string, TimeStats> = {};
  EVENTS.forEach((event) => {
    const eventCheckinTimes = getCheckinTimes(attendeesByEvent[event]);
    byEvent[event] = calculateTimeStats(eventCheckinTimes) || {
      averageTime: "N/A",
      earliestTime: "N/A",
      latestTime: "N/A",
    };
  });

  return {
    ...overallStats,
    byEvent,
  };
}

function calculateTimeDistribution(
  attendeesByEvent: Record<string, attendee[]>
) {
  const distributionByEvent: Record<string, TimeDistribution[]> = {};

  EVENTS.forEach((event) => {
    distributionByEvent[event] = getTimeDistribution(attendeesByEvent[event]);
  });

  return distributionByEvent;
}

function calculatePunctualityStats(
  allAttendees: attendee[],
  attendeesByEvent: Record<string, attendee[]>
) {
  const overallPunctuality = calculatePunctuality(allAttendees);
  const byEvent: Record<string, { onTime: number; late: number }> = {};

  EVENTS.forEach((event) => {
    byEvent[event] = calculatePunctuality(attendeesByEvent[event]);
  });

  return {
    ...overallPunctuality,
    byEvent,
  };
}

// Helper functions
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours % 12 || 12}:${mins.toString().padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;
}

function getCheckinTimes(attendees: attendee[]): string[] {
  return attendees
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
}

function calculatePunctuality(attendees: attendee[]) {
  const checkedInAttendees = attendees.filter((a) => a.checked_in_at);
  let onTime = 0;
  let late = 0;

  checkedInAttendees.forEach((attendee) => {
    const checkinTime = new Date(attendee.checked_in_at!);
    const checkinHour = checkinTime.getHours();
    const checkinMinutes = checkinTime.getMinutes();

    // Consider attendees arriving after 6:15 PM as late
    if (checkinHour > 18 || (checkinHour === 18 && checkinMinutes > 15)) {
      late++;
    } else {
      onTime++;
    }
  });

  return { onTime, late };
}

interface TimeDistribution {
  time: string;
  count: number;
}

function getTimeDistribution(attendees: attendee[]): TimeDistribution[] {
  const timeSlots: TimeDistribution[] = [];
  const checkinTimes = getCheckinTimes(attendees);

  // Initialize time slots from 5:30 PM to 7:00 PM in 15-minute intervals
  const startTime = 17 * 60 + 30; // 5:30 PM in minutes
  const endTime = 19 * 60; // 7:00 PM in minutes

  for (let time = startTime; time <= endTime; time += 15) {
    timeSlots.push({
      time: formatTime(time),
      count: 0,
    });
  }

  // Count attendees in each time slot
  checkinTimes.forEach((timeStr) => {
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === "PM" && hours !== 12) totalMinutes += 12 * 60;
    if (period === "AM" && hours === 12) totalMinutes = minutes;

    // Find the appropriate time slot
    const slotIndex = Math.floor((totalMinutes - startTime) / 15);
    if (slotIndex >= 0 && slotIndex < timeSlots.length) {
      timeSlots[slotIndex].count++;
    }
  });

  return timeSlots;
}
