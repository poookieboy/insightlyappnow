import { supabase } from "@/integrations/supabase/client";
import { noteSubmissionSchema, type NoteDraft, type NoteSubmission, type PublishedNote, type NoteReviewDetail, type NoteStatus } from "./featured-notes";

// Local contract until Cloud can regenerate its schema; reuse the managed client/session.
// No second client, credentials, privileged key, or client-side access decisions.
interface NotesClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string | boolean): any;
      order(column: string, options: { ascending: boolean }): Promise<{ data: unknown; error: unknown }>;
    };
  };
  rpc(name: string, params: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}
const notesClient = supabase as unknown as NotesClient;
const NOTE_COLUMNS = "id,title,grade,subject,topic,content,source,display_name,kind,description,reviewer_name,published_at";

export async function listFeaturedNotes(): Promise<PublishedNote[]> {
  const { data, error } = await notesClient.from("published_notes").select(NOTE_COLUMNS).eq("is_published", true).order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PublishedNote[];
}
export async function getFeaturedNote(id: string): Promise<PublishedNote | null> {
  const { data, error } = await notesClient.from("published_notes").select(NOTE_COLUMNS).eq("is_published", true).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as PublishedNote | null;
}
export async function notesIdentity() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in");
  const { data: admin, error: roleError } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  if (roleError) throw roleError;
  return { userId: data.user.id, reviewer: admin === true };
}
export async function listOwnSubmissions(): Promise<NoteSubmission[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in");
  const { data, error } = await notesClient.from("note_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NoteSubmission[];
}
export async function submitFeaturedNote(draft: NoteDraft, id?: string) {
  const payload = noteSubmissionSchema.parse(draft);
  const { data, error } = await notesClient.rpc("submit_featured_note", { p_payload: payload, p_submission_id: id ?? null });
  if (error) throw error;
  return data as string;
}
export async function listNotesQueue(): Promise<NoteSubmission[]> {
  const { data, error } = await notesClient.from("note_submissions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NoteSubmission[];
}
export async function getNoteReview(id: string): Promise<NoteReviewDetail | null> {
  const { data, error } = await notesClient.from("note_review_details").select("submission_id,internal_comments,reviewed_by").eq("submission_id", id).maybeSingle();
  if (error) throw error;
  return data as NoteReviewDetail | null;
}
export async function createAIReviewDraft(draft: NoteDraft) {
  const payload = noteSubmissionSchema.parse(draft);
  const { error } = await notesClient.rpc("create_featured_ai_draft", { p_payload: payload });
  if (error) throw error;
}
export async function reviewFeaturedNote(note: NoteSubmission, draft: NoteDraft, options: { status: NoteStatus; internal_comments: string; student_feedback: string; description: string; reviewer_name: string }) {
  const payload = noteSubmissionSchema.parse(draft);
  const { error } = await notesClient.rpc("review_featured_note", { p_id: note.id, p_expected_updated_at: note.updated_at, p_payload: { ...payload, ...options } });
  if (error) throw error;
}