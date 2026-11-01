// La publishable key está diseñada para uso público en el navegador.
// La seguridad real depende de RLS; nunca coloques aquí una service_role key.
const SUPABASE_URL = "https://bfyduggphkjxjehygrnx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Z6Iuy7LGwSvNN7qd481uuQ_xq2DCDCp";

if (!window.supabase) throw new Error("No se cargó el SDK de Supabase.");
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
export { supabase };
