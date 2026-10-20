import { z } from "zod";

export const NOTE_GRADES = Array.from({ length: 9 }, (_, i) => `Grade ${i + 1}`);
export const NOTE_STATUSES = ["pending_review", "in_review", "needs_changes", "approved", "rejected"] as const;
export type NoteStatus = typeof NOTE_STATUSES[number];
export const STATUS_LABELS: Record<NoteStatus, string> = {
  pending_review: "Pending Review", in_review: "In Review", needs_changes: "Needs Changes", approved: "Approved", rejected: "Rejected",
};

// Learning-area choices, not a claim that material is KICD-certified.
export function noteSubjects(grade: string): string[] {
  const level = Number(grade.replace("Grade ", ""));
  const common = ["Mathematics", "English", "Kiswahili", "Christian Religious Education", "Islamic Religious Education", "Hindu Religious Education"];
  if (level >= 1 && level <= 3) return [...common, "Indigenous Language", "Environmental Activities", "Creative Activities"];
  if (level >= 4 && level <= 6) return [...common, "Science and Technology", "Agriculture and Nutrition", "Social Studies", "Creative Arts"];
  return [...common, "Integrated Science", "Agriculture and Nutrition", "Social Studies", "Pre-Technical Studies", "Creative Arts and Sports"];
}

const required = (name: string, max: number) => z.string().trim().min(1, `${name} is required.`).max(max, `${name} is too long.`);
export const noteSubmissionSchema = z.object({
  title: required("Title", 160),
  grade: z.string().refine((v) => NOTE_GRADES.includes(v), "Choose a grade from 1 to 9."),
  subject: required("Subject", 100),
  topic: required("Topic", 160),
  content: required("Notes content", 40000),
  source: z.string().trim().max(1000).default(""),
  display_name: z.string().trim().max(80).default(""),
}).refine((v) => noteSubjects(v.grade).includes(v.subject), { path: ["subject"], message: "Choose a subject for this grade." });
export type NoteDraft = z.infer<typeof noteSubmissionSchema>;
export const EMPTY_NOTE_DRAFT: NoteDraft = { title: "", grade: "", subject: "", topic: "", content: "", source: "", display_name: "" };

export interface PublishedNote extends NoteDraft {
  id: string;
  kind: "ai" | "student";
  description: string;
  reviewer_name: string;
  published_at: string;
}
export interface NoteSubmission extends NoteDraft {
  id: string;
  user_id: string;
  kind: "ai" | "student";
  status: NoteStatus;
  student_feedback: string;
  created_at: string;
  updated_at: string;
}
export interface NoteReviewDetail {
  submission_id: string;
  internal_comments: string;
  reviewed_by: string | null;
}

export function filterPublishedNotes(notes: PublishedNote[], filters: { search: string; grade: string; subject: string; topic: string }) {
  const q = filters.search.trim().toLocaleLowerCase();
  return notes.filter((n) => (!filters.grade || n.grade === filters.grade)
    && (!filters.subject || n.subject === filters.subject)
    && (!filters.topic || n.topic === filters.topic)
    && (!q || [n.title, n.topic, n.subject, n.description, n.content, n.display_name].some((v) => v.toLocaleLowerCase().includes(q))));
}

export function canResubmit(status: NoteStatus) { return status === "needs_changes"; }

export function notesError(error: unknown): string {
  const e = error as { code?: string; message?: string };
  if (["42P01", "PGRST202", "PGRST205"].includes(e?.code ?? "")) return "Notes storage is not set up yet. Please try again after the Notes update is connected.";
  if (e?.code === "42501") return "You do not have permission for this action. Please check that you are signed in with the right account.";
  if (e?.message?.includes("sign in")) return "Please sign in to submit notes or check your submissions.";
  if (e?.message?.includes("changed")) return "This submission changed since you opened it. Refresh the queue before saving.";
  return "We couldn’t connect to Notes. Your changes have not been saved. Please try again shortly.";
}

export function notesHead(title: string, description: string) {
  return { meta: [{ title: `${title} | Insightly` }, { name: "description", content: description }, { property: "og:title", content: `${title} | Insightly` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
}