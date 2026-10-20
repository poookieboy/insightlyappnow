import { useState, type FormEvent } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NoteFields } from "./NoteFields";
import { EMPTY_NOTE_DRAFT, noteSubmissionSchema, notesError, type NoteSubmission } from "@/lib/featured-notes";
import { submitFeaturedNote } from "@/lib/featured-notes-api";

export function NoteSubmissionForm({ open, onOpenChange, initial, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; initial?: NoteSubmission; onSaved: () => void }) {
  const [draft, setDraft] = useState(initial ?? EMPTY_NOTE_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = noteSubmissionSchema.safeParse(draft);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setBusy(true); setFailure(""); setErrors({});
    try { await submitFeaturedNote(parsed.data, initial?.id); setSaved(true); onSaved(); }
    catch (e) { setFailure(notesError(e)); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg p-5 sm:p-6">
      <DialogHeader><DialogTitle>{saved ? "Notes submitted" : initial ? "Update your submission" : "Submit your notes"}</DialogTitle><DialogDescription>The Insightly team reviews and corrects submissions before publication. Submitting does not publish your notes.</DialogDescription></DialogHeader>
      {saved ? <div className="py-6 text-center" role="status"><CheckCircle2 className="mx-auto h-10 w-10 text-accent" /><h3 className="mt-3 font-semibold">Ready for review</h3><p className="mt-2 text-sm text-muted-foreground">Your submission is now Pending Review. Follow its progress in My submissions.</p><Button className="mt-5" onClick={() => onOpenChange(false)}>Done</Button></div>
        : <form onSubmit={submit} noValidate className="space-y-5"><NoteFields draft={draft} onChange={setDraft} errors={errors} disabled={busy} />{failure && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{failure}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Send />}Submit for review</Button></div></form>}
    </DialogContent>
  </Dialog>;
}