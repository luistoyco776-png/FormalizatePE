import { supabase } from "../config/supabaseClient.js";
const BUCKET = "documentos";
export async function listDocuments(userId) {
  const { data, error } = await supabase.from("documentos_usuario").select("id,stage_id,file_name,storage_path,mime_type,size_bytes,created_at").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data || []).map(async row => {
    const { data: signed, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(row.storage_path, 3600);
    return { id: row.id, name: row.file_name, stageId: row.stage_id, sizeKb: Math.max(1, Math.round((row.size_bytes || 0) / 1024)), uploadedAt: new Date(row.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }), url: signedError ? null : signed.signedUrl, storagePath: row.storage_path };
  }));
}
export async function uploadDocument(userId, stageId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${stageId}/${crypto.randomUUID()}_${safeName}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from("documentos_usuario").insert({ user_id: userId, stage_id: stageId, file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size }).select().single();
  if (error) { await supabase.storage.from(BUCKET).remove([path]); throw error; }
  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return { id: data.id, name: data.file_name, stageId: data.stage_id, sizeKb: Math.max(1, Math.round(file.size / 1024)), uploadedAt: new Date(data.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }), url: signed?.signedUrl || null, storagePath: path };
}
