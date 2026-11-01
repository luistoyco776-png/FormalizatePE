import { supabase } from "../config/supabaseClient.js";
export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("id,email,nombre_mype,legal_figure,created_at").eq("id", userId).maybeSingle();
  if (error) throw error; return data;
}
export async function saveProfile(userId, patch) {
  const allowed = {};
  if (typeof patch.nombre_mype === "string") allowed.nombre_mype = patch.nombre_mype.trim();
  if (patch.legal_figure === "sac" || patch.legal_figure === "ruc10" || patch.legal_figure === null) allowed.legal_figure = patch.legal_figure;
  const { data, error } = await supabase.from("profiles").update(allowed).eq("id", userId).select().single();
  if (error) throw error; return data;
}
