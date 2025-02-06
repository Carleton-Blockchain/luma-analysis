import { supabase } from "../utils/supabase";

export const fetchAttendees = async (tableName: string) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("api_id, name, email, created_at, checked_in_at")
      .neq("checked_in_at", "");

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Failed to fetch attendees: ${e.message}`);
    }

    throw new Error("Failed to fetch attendees: Unknown error");
  }
};

export const fetchRSVPs = async (tableName: string) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("api_id, name, email, created_at")
      .eq("approval_status", "approved");

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Failed to fetch attendees: ${e.message}`);
    }
    throw new Error("Failed to fetch attendees: Unknown error");
  }
};
