import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft, Save, Printer, Trash2, Copy, Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Heading1, Heading2, Image as ImageIcon, Quote, Link as LinkIcon,
  Strikethrough, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, Sparkles, Loader2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, uid } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(note?.title ?? "");

  useEffect(() => {
    if (note && editorRef.current) {
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

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const insertImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      editorRef.current?.focus();
      document.execCommand(
        "insertHTML", false,
        `<p style="text-align:center"><img src="${dataUrl}" alt="inserted" style="max-width:100%;height:auto;border-radius:6px;margin:8px 0" /></p><p><br/></p>`,
      );
    };
    reader.readAsDataURL(file);
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) insertImageFile(file);
    e.target.value = "";
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          insertImageFile(file);
          return;
        }
      }
    }
  };

  const insertLink = () => {
    const url = prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  };

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

      {/* Word-style toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1.5 shadow-sm print:hidden">
        <ToolBtn onClick={() => exec("undo")} title="Undo"><Undo2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Redo"><Redo2 className="h-4 w-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("formatBlock", "<h1>")} title="Heading 1"><Heading1 className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<h2>")} title="Heading 2"><Heading2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<p>")} title="Paragraph"><span className="text-xs font-semibold">P</span></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline"><UnderlineIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullets"><List className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered"><ListOrdered className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<blockquote>")} title="Quote"><Quote className="h-4 w-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("justifyLeft")} title="Align left"><AlignLeft className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} title="Align center"><AlignCenter className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyRight")} title="Align right"><AlignRight className="h-4 w-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={insertLink} title="Insert link"><LinkIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => fileInputRef.current?.click()} title="Insert image"><ImageIcon className="h-4 w-4" /></ToolBtn>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        <div className="ml-auto flex items-center gap-1">
          <input
            type="color"
            onChange={(e) => exec("foreColor", e.target.value)}
            className="h-6 w-6 cursor-pointer rounded border bg-transparent"
            title="Text color"
          />
        </div>
      </div>

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
          onPaste={onPaste}
          className="ds-doc min-h-[60vh] outline-none"
          data-placeholder="Edit your note…"
        />
      </div>
    </AppShell>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-muted active:scale-95",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px bg-border" />;
}
