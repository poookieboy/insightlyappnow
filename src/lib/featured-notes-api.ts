import { externalSupabase as supabase } from "@/integrations/external-supabase/client";
import { noteSubmissionSchema, type NoteDraft, type NoteSubmission, type PublishedNote, type NoteReviewDetail, type NoteStatus } from "./featured-notes";

// Reuse the existing external client. Its auth session is distinct from the app's legacy connection.
const notesClient = supabase;
const NOTE_COLUMNS = "id,title,grade,subject,topic,content,source,display_name,kind,description,reviewer_name,published_at";

export async function listFeaturedNotes(): Promise<PublishedNote[]> {
  const { data, error } = await notesClient.from("published_notes").select(NOTE_COLUMNS).eq("is_published", true).order("published_at", { ascending: false }).abortSignal(AbortSignal.timeout(12000));
  if (error) throw error;
  return (data ?? []) as PublishedNote[];
}
export async function getFeaturedNote(id: string): Promise<PublishedNote | null> {
  const { data, error } = await notesClient.from("published_notes").select(NOTE_COLUMNS).eq("is_published", true).eq("id", id).abortSignal(AbortSignal.timeout(12000)).maybeSingle();
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
  const { data, error } = await notesClient.from("note_review_details").select("submission_id,internal_comments,reviewed_by,description,reviewer_name").eq("submission_id", id).maybeSingle();
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

/** Existing Groq-only notes helper. Generation never saves, reviews, or publishes. */
export async function improveFeaturedDraft(draft: NoteDraft, action: "summarize" | "simplify"): Promise<string> {
  const identity = await notesIdentity();
  if (!identity.reviewer) throw new Error("Reviewer access required");
  if (!draft.content.trim() || !draft.grade || !draft.subject) throw new Error("Add source notes, grade and subject before using Iris.");
  const { data, error } = await supabase.functions.invoke("ai-notes", {
    body: { action, text: draft.content, grade: draft.grade, subject: draft.subject, curriculum: "CBC" },
  });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context instanceof Response) {
      const payload = await context.clone().json().catch(() => null) as { error?: string } | null;
      if (payload?.error?.includes("GROQ_API_KEY")) throw new Error("Iris is unavailable. Configure the server-side GROQ_API_KEY secret for ai-notes.");
    }
    throw new Error("Iris couldn’t connect to the Notes AI function. Your original notes are unchanged.");
  }
  if (data?.error || typeof data?.content !== "string" || !data.content.trim()) throw new Error("Iris returned no usable notes. Your original notes are unchanged.");
  return data.content;
}