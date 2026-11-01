import { supabase } from "../config/supabaseClient.js";
export async function loadProgress(userId) {
  const [stages, requirements] = await Promise.all([
    supabase.from("etapas_usuario").select("stage_id,status").eq("user_id", userId),
    supabase.from("requisitos_usuario").select("stage_id,req_index,completed").eq("user_id", userId)
  ]);
  if (stages.error) throw stages.error; if (requirements.error) throw requirements.error;
  return { stages: stages.data || [], requirements: requirements.data || [] };
}
export async function saveStage(userId, stageId, status) {
  const { error } = await supabase.from("etapas_usuario").upsert({ user_id:userId, stage_id:stageId, status, updated_at:new Date().toISOString() }, { onConflict:"user_id,stage_id" });
  if (error) throw error;
}
export async function saveRequirement(userId, stageId, index, completed) {
  const { error } = await supabase.from("requisitos_usuario").upsert({ user_id:userId, stage_id:stageId, req_index:index, completed }, { onConflict:"user_id,stage_id,req_index" });
  if (error) throw error;
}
export async function saveFigure(userId, figure) {
  const { error } = await supabase.from("profiles").update({ legal_figure:figure }).eq("id",userId); if(error) throw error;
}
