import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Loader2, ClipboardCheck, Plus, Check, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NoteFields } from "@/components/notes/NoteFields";
import { NoteContent } from "@/components/notes/NoteContent";
import { LoadingNotes, NotesFailure } from "@/components/notes/FeaturedNotesLibrary";
import { EMPTY_NOTE_DRAFT, NOTE_STATUSES, STATUS_LABELS, notesHead, notesError, noteSubmissionSchema, type NoteDraft, type NoteSubmission, type NoteStatus } from "@/lib/featured-notes";
import { createAIReviewDraft, getNoteReview, listNotesQueue, notesIdentity, reviewFeaturedNote } from "@/lib/featured-notes-api";

export const Route = createFileRoute("/notes-review")({ head: () => notesHead("Notes Review", "Insightly’s authorized review and publication workspace for learning notes."), component: () => <RequireProfile><NotesReview /></RequireProfile> });
function NotesReview() {
  const [access, setAccess] = useState<"loading" | "allowed" | "denied" | "error">("loading");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<NoteSubmission[]>([]);
  const [status, setStatus] = useState("open");
  const [selected, setSelected] = useState<NoteSubmission>();
  const [create, setCreate] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const identity = await notesIdentity(); if (!identity.reviewer) { setAccess("denied"); return; } setAccess("allowed"); setQueue(await listNotesQueue()); }
    catch (e) { setError(notesError(e)); setAccess((a) => a === "allowed" ? a : "error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const rows = queue.filter((n) => status === "all" || (status === "open" ? !["approved", "rejected"].includes(n.status) : n.status === status));
  return <AppShell wide className="!bg-none bg-background"><Button asChild variant="ghost" className="mb-4 pl-0"><Link to="/notes"><ArrowLeft />Notes</Link></Button><header className="mb-6"><h1 className="flex items-center gap-2 font-display text-2xl font-bold"><ClipboardCheck className="h-6 w-6 text-accent" />Notes review</h1><p className="mt-1 text-sm text-muted-foreground">Correct, review and publish learning material.</p></header>
    {access === "loading" ? <LoadingNotes /> : access === "denied" ? <div className="py-10 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-3 text-lg font-semibold">Reviewer access required</h2><p className="mt-2 text-sm text-muted-foreground">Only authorized Insightly administrators can review or publish notes.</p></div> : access === "error" ? <NotesFailure message={error} retry={load} /> : <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filter review status" className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open submissions</SelectItem><SelectItem value="all">All submissions</SelectItem>{NOTE_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => setCreate(true)}><Plus />Add AI-assisted draft</Button></div>
      {error ? <NotesFailure message={error} retry={load} /> : loading ? <LoadingNotes /> : rows.length === 0 ? <div className="border-y py-12 text-center"><ClipboardCheck className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="mt-3 font-semibold">Queue is clear</h2><p className="mt-1 text-sm text-muted-foreground">No submissions in this review status.</p></div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((n) => <Card key={n.id} className="rounded-lg p-4"><Badge variant="secondary">{STATUS_LABELS[n.status]}</Badge><h2 className="mt-3 break-words font-semibold">{n.title}</h2><p className="mt-1 break-words text-xs text-muted-foreground">{n.grade} · {n.subject}</p><p className="mt-2 text-xs text-muted-foreground">{n.kind === "ai" ? "AI-assisted draft" : `Student: ${n.display_name || "No public attribution"}`}</p><Button variant="outline" className="mt-4 w-full" onClick={() => setSelected(n)}>Inspect submission</Button></Card>)}</div>}
      {(selected || create) && <ReviewEditor key={selected?.id ?? "create"} note={selected} onClose={() => { setSelected(undefined); setCreate(false); }} onSaved={() => { setSelected(undefined); setCreate(false); void load(); }} />}
    </>}
  </AppShell>;
}
function ReviewEditor({ note, onClose, onSaved }: { note?: NoteSubmission; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<NoteDraft>(note ?? EMPTY_NOTE_DRAFT);
  const [internal, setInternal] = useState("");
  const [feedback, setFeedback] = useState(note?.student_feedback ?? "");
  const [description, setDescription] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(!!note);
  const [detailsError, setDetailsError] = useState(false);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (!note) return;
    let active = true;
    getNoteReview(note.id).then((d) => { if (active) setInternal(d?.internal_comments ?? ""); }).catch((e) => { if (active) { setError(notesError(e)); setDetailsError(true); } }).finally(() => { if (active) setDetailsLoading(false); });
    return () => { active = false; };
  }, [note?.id]);
  async function save(status: NoteStatus) {
    const parsed = noteSubmissionSchema.safeParse(draft);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]))); return; }
    if (status === "approved" && (!description.trim() || !reviewerName.trim())) { setError("Add a short description and public reviewer name before publishing."); return; }
    if (["needs_changes", "rejected"].includes(status) && !feedback.trim()) { setError("Add feedback for the student before requesting changes or rejecting."); return; }
    if (status === "approved" && !window.confirm("Publish these corrected notes to the Notes library?")) return;
    setBusy(true); setError(""); setErrors({});
    try { if (note) await reviewFeaturedNote(note, parsed.data, { status, internal_comments: internal, student_feedback: feedback, description, reviewer_name: reviewerName }); else await createAIReviewDraft(parsed.data); toast.success(status === "approved" ? "Notes approved and published" : note ? "Review saved" : "Draft added to review queue"); onSaved(); }
    catch (e) { setError(notesError(e)); } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={(v) => { if (!v && !busy) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-lg p-5 sm:p-6"><DialogHeader><DialogTitle>{note ? "Review submission" : "Add AI-assisted draft"}</DialogTitle><DialogDescription>{note ? "Internal comments remain private. Student feedback is visible only to the submitter and reviewers." : "Paste existing AI-assisted material here. This does not generate notes or publish them; human review is required."}</DialogDescription></DialogHeader>
    <Button variant="outline" size="sm" className="w-fit" onClick={() => setPreview(!preview)}><Eye />{preview ? "Edit content" : "Preview content"}</Button>
    {preview ? <NoteContent content={draft.content || "No content yet."} /> : <NoteFields draft={draft} onChange={setDraft} errors={errors} disabled={busy} />}
    {note && <div className="space-y-4 border-t pt-4"><div><Label htmlFor="review-private">Internal reviewer comments · private</Label><Textarea id="review-private" value={internal} maxLength={8000} disabled={detailsLoading || busy} onChange={(e) => setInternal(e.target.value)} className="mt-1.5" />{detailsLoading && <p className="text-xs text-muted-foreground">Loading private review…</p>}</div><div><Label htmlFor="review-feedback">Feedback to student</Label><Textarea id="review-feedback" value={feedback} maxLength={2000} disabled={busy} onChange={(e) => setFeedback(e.target.value)} className="mt-1.5" /></div><div><Label htmlFor="review-description">Published short description</Label><Textarea id="review-description" value={description} maxLength={500} disabled={busy} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" /></div><div><Label htmlFor="review-name">Public reviewer name</Label><Input id="review-name" value={reviewerName} maxLength={80} disabled={busy} onChange={(e) => setReviewerName(e.target.value)} className="mt-1.5" /></div></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2 border-t pt-4">{note ? <><Button disabled={busy || detailsLoading || detailsError} variant="outline" onClick={() => void save("in_review")}><Save />Save · In Review</Button><Button disabled={busy || detailsLoading || detailsError} variant="outline" onClick={() => void save("needs_changes")}>Request changes</Button><Button disabled={busy || detailsLoading || detailsError} variant="destructive" onClick={() => void save("rejected")}>Reject</Button><Button disabled={busy || detailsLoading || detailsError} onClick={() => void save("approved")}>{busy ? <Loader2 className="animate-spin" /> : <Check />}Approve & publish</Button></> : <Button disabled={busy} onClick={() => void save("pending_review")}>{busy ? <Loader2 className="animate-spin" /> : <Plus />}Add draft for review</Button>}</div>
  </DialogContent></Dialog>;
}