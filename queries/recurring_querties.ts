import { supabase } from "../utils/supabase";

export const recurring_Attendees = async (
  currentEvent: string,
  pastEvents: string[]
): Promise<any> => {
  try {
    // Get current event attendees
    const { data: currentEventData, error: currentEventError } = await supabase
      .from(currentEvent)
      .select("name, email, checked_in_at")
      .neq("checked_in_at", "");

    if (currentEventError)
      throw new Error(`Failed to fetch ${currentEvent} data`);

    // Fetch data for all past events
    const pastEventResults = await Promise.all(
      pastEvents.map(async (eventName) => {
        const { data, error } = await supabase
          .from(eventName)
          .select("name, email, checked_in_at")
          .neq("checked_in_at", "");

        if (error) throw new Error(`Failed to fetch ${eventName} data`);
        return data;
      })
    );

    const currentEventEmails = new Set(
      currentEventData.map((attendee) => attendee.email)
    );

    const pastEventEmailSets = pastEventResults.map(
      (eventData) => new Set(eventData.map((attendee) => attendee.email))
    );

    const recurringAttendees = new Set(
      [...currentEventEmails].filter((email) =>
        pastEventEmailSets.every((eventSet) => eventSet.has(email))
      )
    );

    const recurringDetails = currentEventData
      .filter((attendee) => recurringAttendees.has(attendee.email))
      .map((attendee) => ({
        name: attendee.name,
        email: attendee.email,
        checkedInAt: attendee.checked_in_at,
      }));

    return {
      currentEventData,
      pastEventResults,
      recurringDetails,
    };
  } catch (e) {
    throw e;
  }
};
