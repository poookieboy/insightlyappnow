import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingNotes, NotesFailure } from "@/components/notes/FeaturedNotesLibrary";
import { NoteContent } from "@/components/notes/NoteContent";
import { getFeaturedNote } from "@/lib/featured-notes-api";
import { notesError, notesHead, type PublishedNote } from "@/lib/featured-notes";

export const Route = createFileRoute("/featured-notes/$noteId")({
  head: () => notesHead("Read Notes", "Read Insightly’s published, team-reviewed learning notes and revision material."),
  component: () => <RequireProfile><PublishedNoteReader /></RequireProfile>,
});
function PublishedNoteReader() {
  const { noteId } = Route.useParams();
  const [note, setNote] = useState<PublishedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true; setLoading(true); setError("");
    getFeaturedNote(noteId).then((n) => { if (current) setNote(n); }).catch((e) => { if (current) setError(notesError(e)); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [noteId, retry]);
  return <AppShell className="!bg-none bg-background"><div className="mx-auto max-w-3xl">
    <Button asChild variant="ghost" className="mb-5 pl-0"><Link to="/notes"><ArrowLeft />Back to Notes</Link></Button>
    {loading ? <LoadingNotes /> : error ? <NotesFailure message={error} retry={() => setRetry(retry + 1)} /> : !note ? <div className="py-12 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold">Note unavailable</h1><p className="mt-2 text-sm text-muted-foreground">This note may not have been published or may have been returned for review.</p></div> : <article>
      <header className="mb-7 border-b pb-6"><div className="mb-3 flex flex-wrap gap-2"><Badge variant="secondary">{note.subject}</Badge><Badge variant="outline">{note.grade}</Badge><Badge variant="outline">{note.kind === "ai" ? "AI-Featured" : "Student-Featured"}</Badge></div><h1 className="break-words font-display text-2xl font-bold sm:text-3xl">{note.title}</h1><p className="mt-2 text-sm text-muted-foreground">{note.topic}</p><p className="mt-3 text-sm text-muted-foreground">{note.description}</p><div className="mt-4 space-y-1 text-xs text-muted-foreground"><p>{note.kind === "ai" ? "AI-assisted material" : `By ${note.display_name || "Student contributor"}`}</p><p className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent" />Reviewed by {note.reviewer_name}</p><p>Published {new Date(note.published_at).toLocaleDateString()}</p></div></header>
      <NoteContent content={note.content} />
      {note.source && <footer className="mt-10 border-t pt-5"><h2 className="text-sm font-semibold">Sources / references</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{note.source}</p></footer>}
    </article>}
  </div></AppShell>;
}