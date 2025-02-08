/* eslint-disable */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useAnalytics } from "@/hooks/useAnalytics";
import { StatsCardsWidget } from "./components/StatsCardsWidget";
import { GuestTypeChart } from "./components/guestType";
import { EventStatsWidget } from "./components/EventStatsWidget";
import { AttendanceChart } from "./components/attendence";

// Add allowed emails
const ALLOWED_EMAILS = ["rodneyshenn@gmail.com", "alvinay73@gmail.com"];

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const { loading, error, data } = useAnalytics();

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }

      // Check if email is allowed
      const userEmail = session.user?.email;
      if (!userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
        supabase.auth.signOut();
        router.push("/login");
        return;
      }

      setSession(session);
    });

    // Set up auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!session) {
    return <div>Redirecting to login...</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  const totalRecurringMembers = Array.from(data.eventStats.values()).reduce(
    (sum, stat) => sum + (stat.recurring || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Carleton Blockchain Lumalytics
        </h1>

        <StatsCardsWidget
          RSVPs={data.allRSVPs}
          attendees={data.allAttendees}
          rsvpsByEvent={data.rsvpsByEvent}
          attendeesByEvent={data.attendeesByEvent}
          totalNewMembers={data.eventStats.get("total")?.new || 0}
          totalRecurringMembers={totalRecurringMembers || 0}
          attendanceStats={data.attendanceStats}
          punctualityStats={data.punctualityStats}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GuestTypeChart
            data={[
              { name: "All RSVPs", value: data.allRSVPs.length },
              { name: "All Checkins", value: data.allAttendees.length },
            ]}
          />
          <AttendanceChart />
        </div>

        {Object.entries(data.rsvpsByEvent).map(([event, rsvps]) => (
          <EventStatsWidget
            key={event}
            event={event}
            rsvps={rsvps}
            attendees={data.attendeesByEvent[event]}
            eventStats={data.eventStats.get(event)}
            attendanceStats={data.attendanceStats.byEvent[event]}
            punctualityStats={data.punctualityStats.byEvent[event]}
            timeDistribution={data.timeDistributionByEvent[event]}
          />
        ))}
      </div>
    </div>
  );
}
