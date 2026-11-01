import { supabase } from "../config/supabaseClient.js";

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles")
    .select("id,email,nombre_mype,legal_figure,diagnostic_answers")
    .eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, changes) {
  const { data, error } = await supabase.from("profiles")
    .update(changes).eq("id", userId)
    .select("id,email,nombre_mype,legal_figure,diagnostic_answers").single();
  if (error) throw error;
  return data;
}
