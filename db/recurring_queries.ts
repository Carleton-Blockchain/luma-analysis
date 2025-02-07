import { supabase } from "@/utils/supabase";

export const getRecurring = async (current: string, pastEvents: string[]) => {
  try {
    const { data: currentEventData, error: currentError } = await supabase
      .from(current)
      .select("name, email, checked_in_at")
      .neq("checked_in_at", "");

    const pastEventsData = await Promise.all(
      pastEvents.map(async (eventName) => {
        const { data, error } = await supabase
          .from(eventName)
          .select("name, email, checked_in_at")
          .neq("checked_in_at", "");

        if (error) throw error;
        return { eventName, data };
      })
    );

    const currentAttendees =
      currentEventData?.map((user) => ({
        email: user.email,
        name: user.name,
        checked_in_at: user.checked_in_at,
      })) || [];

    const anyPastEventEmails = new Set(
      pastEventsData.flatMap(
        ({ data }) => data?.map((user) => user.email) || []
      )
    );

    const returningAttendees = currentAttendees.filter((user) =>
      anyPastEventEmails.has(user.email)
    );

    return returningAttendees;
  } catch (e) {
    console.error("Error fetching recurring data:", e);
    throw e;
  }
};
