import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Save, Printer, Trash2, Copy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, uid } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/notes/$noteId")({
  component: () => (
    <RequireProfile>
      <NoteViewer />
    </RequireProfile>
  ),
});

function NoteViewer() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const { state, update } = useStore();
  const note = state.notes.find((n) => n.id === noteId);
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(note?.title ?? "");

  useEffect(() => {
    if (note && editorRef.current) {
      // Render rich content if HTML, fall back to plain text.
      const looksLikeHtml = /<[a-z][\s\S]*>/i.test(note.content);
      editorRef.current.innerHTML = looksLikeHtml
        ? note.content
        : (note.content || "").replace(/\n/g, "<br/>");
    }
  }, [note]);

  if (!note) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Note not found.</p>
        <Link to="/notes"><Button variant="outline" className="mt-3">Back to notes</Button></Link>
      </AppShell>
    );
  }

  const save = () => {
    const html = editorRef.current?.innerHTML ?? "";
    update((s) => ({
      ...s,
      notes: s.notes.map((n) =>
        n.id === note.id ? { ...n, title: title || "Untitled", content: html } : n,
      ),
    }));
    toast.success("Saved");
  };

  const duplicate = () => {
    const html = editorRef.current?.innerHTML ?? note.content;
    update((s) => ({
      ...s,
      notes: [{ ...note, id: uid(), title: `${title} (copy)`, content: html, createdAt: new Date().toISOString() }, ...s.notes],
    }));
    toast.success("Duplicated");
    navigate({ to: "/notes" });
  };

  const remove = () => {
    if (!confirm("Delete this note?")) return;
    update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== note.id) }));
    navigate({ to: "/notes" });
  };

  const printAsPdf = () => window.print();

  return (
    <AppShell>
      <div className="mb-3 flex items-center justify-between print:hidden">
        <Link to="/notes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Notes
        </Link>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={duplicate} title="Duplicate"><Copy className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={printAsPdf} title="Print / Save PDF"><Printer className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={remove} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          <Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" /> Save</Button>
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-3 h-9 border-none bg-transparent px-1 text-base font-semibold focus-visible:ring-1 print:hidden"
      />

      {/* PDF-style editable page */}
      <div className="mx-auto w-full max-w-[816px] rounded-md bg-white p-6 text-black shadow-lg ring-1 ring-border sm:p-10 dark:bg-zinc-100 print:p-0 print:shadow-none print:ring-0">
        <h1 className="mb-4 hidden text-2xl font-bold print:block">{title}</h1>
        {note.imageDataUrl && (
          <img src={note.imageDataUrl} alt={title} className="mb-4 max-h-96 w-full rounded object-contain" />
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="ds-doc min-h-[60vh] outline-none"
          data-placeholder="Edit your note…"
        />
      </div>
    </AppShell>
  );
}
