import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bfyduggphkjxjehygrnx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Z6Iuy7LGwSvNN7qd481uuQ_xq2DCDCp";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
