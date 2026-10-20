import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Search, SlidersHorizontal, Sparkles, Users, ArrowUpRight, Plus, RotateCcw, Loader2, ClipboardCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { NOTE_GRADES, STATUS_LABELS, canResubmit, filterPublishedNotes, notesError, noteSubjects, type PublishedNote, type NoteSubmission } from "@/lib/featured-notes";
import { listFeaturedNotes, listOwnSubmissions, notesIdentity } from "@/lib/featured-notes-api";
import { NoteSubmissionForm } from "./NoteSubmissionForm";

export function FeaturedNotesLibrary() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<PublishedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", grade: "", subject: "", topic: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NoteSubmission>();
  const [own, setOwn] = useState<NoteSubmission[]>([]);
  const [ownError, setOwnError] = useState("");
  const [ownLoading, setOwnLoading] = useState(false);
  const [showOwn, setShowOwn] = useState(false);
  const [reviewer, setReviewer] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setNotes(await listFeaturedNotes()); } catch (e) { setError(notesError(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setReviewer(false); if (user) void notesIdentity().then((identity) => setReviewer(identity.reviewer)).catch(() => {}); }, [user?.id]);
  async function loadOwn() {
    setOwnLoading(true); setOwnError("");
    try { setOwn(await listOwnSubmissions()); } catch (e) { setOwnError(notesError(e)); }
    finally { setOwnLoading(false); }
  }
  const subjects = useMemo(() => filters.grade ? noteSubjects(filters.grade) : [...new Set(NOTE_GRADES.flatMap(noteSubjects))], [filters.grade]);
  const topics = useMemo(() => [...new Set(notes.filter((n) => (!filters.grade || n.grade === filters.grade) && (!filters.subject || n.subject === filters.subject)).map((n) => n.topic))].sort(), [notes, filters.grade, filters.subject]);
  const filtered = filterPublishedNotes(notes, filters);
  const activeFilters = !!(filters.search || filters.grade || filters.subject || filters.topic);
  return <div className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-accent" />Reviewed before publication</p>
      <div className="flex flex-wrap gap-2">
        {reviewer && <Button asChild variant="outline"><Link to="/notes-review"><ClipboardCheck />Review queue</Link></Button>}
        {user ? <><Button variant="outline" onClick={() => { setShowOwn(!showOwn); if (!showOwn) void loadOwn(); }}>My submissions</Button><Button onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus />Submit your notes</Button></>
          : <Button asChild><Link to="/auth"><Plus />Sign in to submit notes</Link></Button>}
      </div>
    </div>
    <section aria-label="Search and filter notes" className="space-y-4 border-y border-border py-5">
      <div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" /><Input aria-label="Search notes" placeholder="Search notes, topics or key points" maxLength={200} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="h-11 bg-card pl-10" /></div>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <div><Label htmlFor="notes-filter-grade" className="text-xs text-muted-foreground">Grade / class</Label><Select value={filters.grade || "all"} onValueChange={(v) => setFilters({ ...filters, grade: v === "all" ? "" : v, subject: "", topic: "" })}><SelectTrigger id="notes-filter-grade" className="mt-1 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All grades</SelectItem>{NOTE_GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
        <div><Label htmlFor="notes-filter-subject" className="text-xs text-muted-foreground">Subject</Label><Select value={filters.subject || "all"} onValueChange={(v) => setFilters({ ...filters, subject: v === "all" ? "" : v, topic: "" })}><SelectTrigger id="notes-filter-subject" className="mt-1 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div><Label htmlFor="notes-filter-topic" className="text-xs text-muted-foreground">Topic</Label><Select value={filters.topic || "all"} onValueChange={(v) => setFilters({ ...filters, topic: v === "all" ? "" : v })}><SelectTrigger id="notes-filter-topic" className="mt-1 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All topics</SelectItem>{topics.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      </div>
      {activeFilters && <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground" aria-live="polite">{filtered.length} matching {filtered.length === 1 ? "note" : "notes"}</p><Button variant="ghost" size="sm" onClick={() => setFilters({ search: "", grade: "", subject: "", topic: "" })}><SlidersHorizontal />Clear filters</Button></div>}
    </section>
    {showOwn && <section aria-label="My submissions" className="border-b pb-6"><h2 className="text-lg font-semibold">My submissions</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">These are separate from published notes.</p>{ownLoading ? <LoadingNotes /> : ownError ? <NotesFailure message={ownError} retry={loadOwn} /> : own.length === 0 ? <p className="py-3 text-sm text-muted-foreground">You haven’t submitted any notes yet.</p> : <div className="space-y-3">{own.map((n) => <Card key={n.id} className="rounded-lg p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="min-w-0 break-words font-medium">{n.title}</h3><Badge variant="secondary">{STATUS_LABELS[n.status]}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{n.grade} · {n.subject} · {n.topic}</p>{n.student_feedback && <p className="mt-3 whitespace-pre-wrap break-words border-l-2 border-accent pl-3 text-sm">{n.student_feedback}</p>}{canResubmit(n.status) && <Button variant="outline" className="mt-3" onClick={() => { setEditing(n); setFormOpen(true); }}>Update and resubmit</Button>}</Card>)}</div>}</section>}
    {loading ? <LoadingNotes /> : error ? <NotesFailure message={error} retry={load} /> : <div className="grid gap-8 lg:grid-cols-2">{(["ai", "student"] as const).map((kind) => {
      const entries = filtered.filter((n) => n.kind === kind);
      const Icon = kind === "ai" ? Sparkles : Users;
      return <section key={kind} aria-labelledby={`notes-${kind}-heading`}><div className="mb-1 flex items-center gap-2"><Icon className={`h-5 w-5 ${kind === "ai" ? "text-accent" : "text-tile-green"}`} /><h2 id={`notes-${kind}-heading`} className="font-display text-lg font-semibold">{kind === "ai" ? "AI-Featured Notes" : "Student-Featured Notes"}</h2><span className="ml-auto text-xs text-muted-foreground">{entries.length}</span></div><p className="mb-4 text-sm text-muted-foreground">{kind === "ai" ? "AI-assisted material, checked by the Insightly team." : "Student contributions, reviewed and corrected by our team."}</p>{entries.length ? <div className="grid gap-3">{entries.map((n) => <Card key={n.id} className="rounded-lg p-5 transition-colors hover:border-accent/50"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{n.subject}</Badge><span className="text-xs text-muted-foreground">{n.grade}</span></div><h3 className="mt-3 break-words text-lg font-semibold"><Link to="/featured-notes/$noteId" params={{ noteId: n.id }} className="outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{n.title}</Link></h3><p className="mt-1 text-xs text-muted-foreground">{n.topic}</p><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{n.description}</p><div className="mt-4 border-t pt-3 text-xs text-muted-foreground"><p>{kind === "ai" ? "AI-assisted" : `By ${n.display_name || "Student contributor"}`} · Reviewed by {n.reviewer_name}</p><Button asChild variant="link" className="mt-1 h-auto px-0"><Link to="/featured-notes/$noteId" params={{ noteId: n.id }}>Read note <ArrowUpRight /></Link></Button></div></Card>)}</div> : <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed bg-card/60 px-5 py-7 text-center"><BookOpen className="h-8 w-8 text-muted-foreground/60" /><h3 className="mt-3 text-sm font-medium">{activeFilters ? "No notes match these filters" : "No published notes yet"}</h3><p className="mt-1 max-w-xs text-sm text-muted-foreground">{activeFilters ? "Try another subject or clear your filters." : "Reviewed notes will appear here once the Insightly team publishes them."}</p></div>}</section>;
    })}</div>}
    {formOpen && <NoteSubmissionForm key={editing?.id ?? "new"} open={formOpen} onOpenChange={setFormOpen} initial={editing} onSaved={() => { setShowOwn(true); void loadOwn(); }} />}
  </div>;
}

export function LoadingNotes() { return <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading notes…</div>; }
export function NotesFailure({ message, retry }: { message: string; retry: () => unknown }) { return <div role="alert" className="border-l-2 border-warning bg-warning/5 p-4"><h2 className="font-semibold">Notes are temporarily unavailable</h2><p className="mt-1 text-sm text-muted-foreground">{message}</p><Button variant="outline" size="sm" onClick={() => void retry()} className="mt-3"><RotateCcw />Try again</Button></div>; }