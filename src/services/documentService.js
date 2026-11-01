import { supabase } from "../config/supabaseClient.js";
const BUCKET = "documentos";
export async function listDocuments(userId) {
  const { data, error } = await supabase.from("documentos_usuario").select("id,stage_id,file_name,storage_path,mime_type,size_bytes,created_at").eq("user_id",userId).order("created_at",{ascending:false});
  if(error) throw error;
  return Promise.all((data||[]).map(async row => {
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(row.storage_path, 300);
    return { id:row.id, name:row.file_name, stageId:row.stage_id, sizeKb:Math.max(1,Math.round((row.size_bytes||0)/1024)), uploadedAt:new Date(row.created_at).toLocaleDateString("es-PE"), url:signed.data?.signedUrl || null, storagePath:row.storage_path, demoUpload:false };
  }));
}
export async function uploadDocument(userId, stageId, file) {
  const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g,"_");
  const path = `${userId}/${stageId}/${crypto.randomUUID()}_${safeName}`;
  const upload = await supabase.storage.from(BUCKET).upload(path,file,{ upsert:false, contentType:file.type || "application/octet-stream" });
  if(upload.error) throw upload.error;
  const record = await supabase.from("documentos_usuario").insert({ user_id:userId, stage_id:stageId, file_name:file.name, storage_path:path, mime_type:file.type, size_bytes:file.size }).select().single();
  if(record.error) { await supabase.storage.from(BUCKET).remove([path]); throw record.error; }
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(path,300);
  return { id:record.data.id, name:file.name, stageId, sizeKb:Math.max(1,Math.round(file.size/1024)), uploadedAt:new Date(record.data.created_at).toLocaleDateString("es-PE"), url:signed.data?.signedUrl || null, storagePath:path, demoUpload:false };
}
export async function deleteDocument(doc) {
  const storage = await supabase.storage.from(BUCKET).remove([doc.storagePath]); if(storage.error) throw storage.error;
  const { error } = await supabase.from("documentos_usuario").delete().eq("id",doc.id); if(error) throw error;
}
