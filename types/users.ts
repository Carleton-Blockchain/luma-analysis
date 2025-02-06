export type attendee = {
  api_id: string;
  name: string;
  email: string;
  created_at: string;
  checked_in_at: string | null;
};

export interface attendeeHistory {
  name: string;
  email: string;
  event_participation: Record<string, string>;
}
