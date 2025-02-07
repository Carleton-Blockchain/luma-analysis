import { GuestTypeChart } from "@/app/components/guestType";
import { AttendanceChart } from "@/app/components/attendence";
import { attendee } from "@/types/users";

interface ChartGridProps {
  RSVPs: attendee[];
  attendees: attendee[];
}

export function ChartGrid({ RSVPs, attendees }: ChartGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
      <GuestTypeChart
        data={[
          { name: "All RSVPs", value: RSVPs.length },
          { name: "All Checkins", value: attendees.length },
        ]}
      />
      <AttendanceChart />
    </div>
  );
}
