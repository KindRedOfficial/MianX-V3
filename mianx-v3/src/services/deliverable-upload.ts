import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "deliverables";

/**
 * Upload a base64-encoded file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToStorage({
  projectId,
  name,
  base64Content,
  mimeType,
}: {
  projectId: string;
  name: string;
  base64Content: string;
  mimeType: string;
}): Promise<string> {
  // Strip data-URL prefix if present (e.g. "data:application/pdf;base64,...")
  const raw = base64Content.includes(",") ? base64Content.split(",")[1]! : base64Content;

  const ext = mimeTypeToExt(mimeType);
  const storagePath = `${projectId}/${Date.now()}-${name}.${ext}`;

  // Convert base64 → Buffer → Uint8Array for Supabase upload
  const buffer = Buffer.from(raw, "base64");
  const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, uint8, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

function mimeTypeToExt(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "text/plain": "txt",
    "application/json": "json",
    "text/csv": "csv",
  };
  return map[mime] ?? "bin";
}
