// Helpers for uploading note attachments (photos, sketches, audio, covers)
// to the private `note-attachments` bucket. Objects are organized as
// `{user_id}/{note_id or 'covers'}/{uuid}.{ext}` so RLS restricts access.

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "note-attachments";

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp3") || mime.includes("mpeg")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  return "bin";
}

export async function uploadAttachment(
  blob: Blob | File,
  opts: { folder: string; ext?: string },
): Promise<{ path: string; url: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const ext = opts.ext ?? extFromMime(blob.type);
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${user.id}/${opts.folder}/${name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const url = await signedUrl(path);
  return { path, url };
}

export async function signedUrl(path: string, expiresIn = 60 * 60 * 24 * 7): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

/** Resolve a stored value that could be a full URL or a storage path. */
export async function resolveMedia(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http") || pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }
  try {
    return await signedUrl(pathOrUrl);
  } catch {
    return "";
  }
}

export async function removeAttachment(path: string) {
  if (!path || path.startsWith("http") || path.startsWith("data:")) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
