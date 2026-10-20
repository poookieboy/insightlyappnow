import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOTE_GRADES, noteSubjects, type NoteDraft } from "@/lib/featured-notes";

export function NoteFields({ draft, onChange, errors = {}, disabled = false }: {
  draft: NoteDraft; onChange: (draft: NoteDraft) => void; errors?: Record<string, string>; disabled?: boolean;
}) {
  const set = (key: keyof NoteDraft, value: string) => onChange({ ...draft, [key]: value });
  const error = (key: keyof NoteDraft) => errors[key] ? <p id={`note-${key}-error`} className="mt-1 text-xs text-destructive">{errors[key]}</p> : null;
  return <fieldset disabled={disabled} className="space-y-4">
    <div><Label htmlFor="note-title">Title <span aria-hidden="true">*</span></Label><Input id="note-title" required maxLength={160} value={draft.title} onChange={(e) => set("title", e.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? "note-title-error" : undefined} placeholder="Give your notes a clear title" className="mt-1.5" />{error("title")}</div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div><Label htmlFor="note-grade">Grade / class <span aria-hidden="true">*</span></Label><Select disabled={disabled} value={draft.grade} onValueChange={(grade) => onChange({ ...draft, grade, subject: "" })}><SelectTrigger id="note-grade" aria-invalid={!!errors.grade} className="mt-1.5"><SelectValue placeholder="Choose grade" /></SelectTrigger><SelectContent>{NOTE_GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>{error("grade")}</div>
      <div><Label htmlFor="note-subject">Subject <span aria-hidden="true">*</span></Label><Select disabled={disabled || !draft.grade} value={draft.subject} onValueChange={(s) => set("subject", s)}><SelectTrigger id="note-subject" aria-invalid={!!errors.subject} className="mt-1.5"><SelectValue placeholder="Choose subject" /></SelectTrigger><SelectContent>{noteSubjects(draft.grade).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>{error("subject")}</div>
    </div>
    <div><Label htmlFor="note-topic">Topic <span aria-hidden="true">*</span></Label><Input id="note-topic" required maxLength={160} value={draft.topic} onChange={(e) => set("topic", e.target.value)} className="mt-1.5" placeholder="Topic or learning area" aria-invalid={!!errors.topic} />{error("topic")}</div>
    <div><Label htmlFor="note-content">Notes content <span aria-hidden="true">*</span></Label><Textarea id="note-content" required maxLength={40000} rows={10} value={draft.content} onChange={(e) => set("content", e.target.value)} className="mt-1.5 min-h-56 leading-relaxed" aria-invalid={!!errors.content} placeholder="Write your notes, key points and examples…" />{error("content")}</div>
    <div><Label htmlFor="note-source">Source / reference <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="note-source" maxLength={1000} rows={2} value={draft.source} onChange={(e) => set("source", e.target.value)} className="mt-1.5" placeholder="Book, lesson or reference used" />{error("source")}</div>
    <div><Label htmlFor="note-display_name">Attribution / display name <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="note-display_name" maxLength={80} value={draft.display_name} onChange={(e) => set("display_name", e.target.value)} className="mt-1.5" placeholder="Name to credit if your notes are published" />{error("display_name")}</div>
  </fieldset>;
}