import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

const redirectUrl = "https://dashboard.carletonblockchain.ca";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: redirectUrl,
  },
});

console.log("Connected to Supabase successfully!");
