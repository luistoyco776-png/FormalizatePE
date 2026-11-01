import { supabase } from "../config/supabaseClient.js";
import { DATA } from "../data/appData.js";
export async function loadProgress(userId) {
  const [stagesRes, reqRes] = await Promise.all([
    supabase.from("etapas_usuario").select("stage_id,status").eq("user_id", userId),
    supabase.from("requisitos_usuario").select("stage_id,req_index,completed").eq("user_id", userId)
  ]);
  if (stagesRes.error) throw stagesRes.error; if (reqRes.error) throw reqRes.error;
  const statuses = Object.fromEntries(DATA.stages.map(s => [s.id, s.initialStatus]));
  for (const row of stagesRes.data || []) statuses[row.stage_id] = row.status;
  const checklist = {};
  for (const row of reqRes.data || []) { if (!checklist[row.stage_id]) checklist[row.stage_id] = []; if (row.completed) checklist[row.stage_id].push(Number(row.req_index)); }
  return { statuses, checklist };
}
export async function saveStageProgress(userId, stageId, status, checkedIndexes) {
  const { error: stageError } = await supabase.from("etapas_usuario").upsert({ user_id: userId, stage_id: stageId, status, updated_at: new Date().toISOString() }, { onConflict: "user_id,stage_id" });
  if (stageError) throw stageError;
  const stage = DATA.stages.find(s => s.id === stageId);
  const rows = stage.requirements.map((_, index) => ({ user_id: userId, stage_id: stageId, req_index: index, completed: checkedIndexes.includes(index) }));
  const { error: reqError } = await supabase.from("requisitos_usuario").upsert(rows, { onConflict: "user_id,stage_id,req_index" });
  if (reqError) throw reqError;
}
