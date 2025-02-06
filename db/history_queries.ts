import { supabase } from "@/utils/supabase";

export const getHistory = async () => {
    try {
      // Fetch data from all tables separately
      const { data: members, error: membersError } = await supabase
        .from("All Members")
        .select("name, email");
  
      const { data: bobaEvents, error: bobaError } = await supabase
        .from("Boba and Blockchains")
        .select("name, email, checked_in_at")
        .eq("approval_status", "approved");
  
      const { data: blockchain101, error: blockchainError } = await supabase
        .from("Blockchain 101")
        .select("name, email, checked_in_at")
        .eq("approval_status", "approved");
  
      const { data: onchainCases, error: onchainError } = await supabase
        .from("Onchain Use Cases w Patrick")
        .select("name, email, checked_in_at")
        .eq("approval_status", "approved");
  
      // Handle errors first
      if (membersError || bobaError || blockchainError || onchainError) {
        console.error("Error fetching data:", {
          membersError,
          bobaError,
          blockchainError,
          onchainError,
        });
        throw new Error("Failed to fetch event data");
      }
  
      // Process the data
      const result = members.map((member) => {
        const eventParticipation: Record<string, string> = {};
  
        // Helper function to check events
        const checkEvents = (events: any[], eventName: string) => {
          const event = events.find(
            (e) => e.name === member.name && e.email === member.email
          );
          if (event) {
            eventParticipation[eventName] = event.checked_in_at
              ? "Attended"
              : "RSVP no-show";
          }
        };
  
        // Check each event type
        checkEvents(bobaEvents, "Boba and Blockchains");
        checkEvents(blockchain101, "Blockchain 101");
        checkEvents(onchainCases, "Onchain Use Cases w Patrick");
  
        return {
          student_name: member.name,
          student_email: member.email,
          event_participation: eventParticipation,
        };
      });
  
      return result;
    } catch (e) {
      throw new Error("Failed to process event history");
    }
  };
  