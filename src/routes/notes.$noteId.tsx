import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft, Save, Printer, Trash2, Copy, Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Heading1, Heading2, Heading3, Image as ImageIcon, Quote, Link as LinkIcon,
  Strikethrough, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Sparkles, Loader2, Highlighter, Minus, Subscript, Superscript, Indent, Outdent,
  Table as TableIcon, RemoveFormatting, Type, FileDown,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, uid } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  const [aiLoading, setAiLoading] = useState<null | "summarize" | "simplify" | "quiz" | "exam">(null);
  const runAI = async (action: "summarize" | "simplify" | "quiz" | "exam") => {
    const text = editorRef.current?.innerText?.trim() || "";
    if (!text) { toast.error("Note is empty"); return; }
    setAiLoading(action);
    try {
      const profile = state.profile;
      const { data, error } = await supabase.functions.invoke("ai-notes", {
        body: { action, text, grade: profile?.grade, curriculum: profile?.curriculum },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const content: string = data?.content || "";
      // Append result as a new section
      const html = `<hr/><h2>✨ Iris — ${action}</h2><pre style="white-space:pre-wrap;font-family:inherit">${content.replace(/[<>]/g, (c) => c === "<" ? "&lt;" : "&gt;")}</pre>`;
      if (editorRef.current) {
        editorRef.current.innerHTML = (editorRef.current.innerHTML || "") + html;
      }
      toast.success(`Iris ${action} added`);
    } catch (e: any) {
      toast.error(e?.message || "AI action failed");
    } finally {
      setAiLoading(null);
    }
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

  const insertTable = () => {
    const rows = Number(prompt("Rows", "3") || 0);
    const cols = Number(prompt("Columns", "3") || 0);
    if (!rows || !cols) return;
    let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0">';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #999;padding:6px;min-width:40px">&nbsp;</td>';
      }
      html += "</tr>";
    }
    html += "</table><p><br/></p>";
    document.execCommand("insertHTML", false, html);
  };

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

      {/* Word-style ribbon */}
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1.5 shadow-sm print:hidden">
        <ToolBtn onClick={() => exec("undo")} title="Undo"><Undo2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Redo"><Redo2 className="h-4 w-4" /></ToolBtn>
        <Sep />

        {/* Font family */}
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => { exec("fontName", e.target.value); e.currentTarget.value = ""; }}
          className="h-7 rounded-md border bg-background px-1 text-xs"
          title="Font"
          defaultValue=""
        >
          <option value="" disabled>Font</option>
          <option value="Calibri, sans-serif">Calibri</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Times New Roman, serif">Times New Roman</option>
          <option value="Courier New, monospace">Courier New</option>
          <option value="Comic Sans MS, cursive">Comic Sans</option>
        </select>
        {/* Font size — execCommand uses 1-7 scale */}
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => { exec("fontSize", e.target.value); e.currentTarget.value = ""; }}
          className="h-7 rounded-md border bg-background px-1 text-xs"
          title="Font size"
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          <option value="1">8</option>
          <option value="2">10</option>
          <option value="3">12</option>
          <option value="4">14</option>
          <option value="5">18</option>
          <option value="6">24</option>
          <option value="7">36</option>
        </select>

        <Sep />
        <ToolBtn onClick={() => exec("formatBlock", "<h1>")} title="Heading 1"><Heading1 className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<h2>")} title="Heading 2"><Heading2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<h3>")} title="Heading 3"><Heading3 className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<p>")} title="Paragraph"><Type className="h-4 w-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("bold")} title="Bold (Ctrl+B)"><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic (Ctrl+I)"><Italic className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline (Ctrl+U)"><UnderlineIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("subscript")} title="Subscript"><Subscript className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("superscript")} title="Superscript"><Superscript className="h-4 w-4" /></ToolBtn>
        <Sep />
        <label className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-muted" title="Text color">
          <span className="text-xs font-bold">A</span>
          <input
            type="color"
            onChange={(e) => exec("foreColor", e.target.value)}
            className="absolute h-0 w-0 opacity-0"
          />
        </label>
        <label className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-muted" title="Highlight">
          <Highlighter className="h-4 w-4" />
          <input
            type="color"
            onChange={(e) => exec("hiliteColor", e.target.value)}
            className="absolute h-0 w-0 opacity-0"
          />
        </label>
        <ToolBtn onClick={() => exec("removeFormat")} title="Clear formatting"><RemoveFormatting className="h-4 w-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullets"><List className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered"><ListOrdered className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("outdent")} title="Decrease indent"><Outdent className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("indent")} title="Increase indent"><Indent className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<blockquote>")} title="Quote"><Quote className="h-4 w-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => exec("justifyLeft")} title="Align left"><AlignLeft className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} title="Align center"><AlignCenter className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyRight")} title="Align right"><AlignRight className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyFull")} title="Justify"><AlignJustify className="h-4 w-4" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={insertLink} title="Insert link"><LinkIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => fileInputRef.current?.click()} title="Insert image"><ImageIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={insertTable} title="Insert table"><TableIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal rule"><Minus className="h-4 w-4" /></ToolBtn>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onPickImage} />

        <div className="ml-auto flex items-center gap-1">
          {(["summarize","simplify","quiz","exam"] as const).map((a) => (
            <Button
              key={a}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => runAI(a)}
              disabled={!!aiLoading}
              title={`Iris: ${a}`}
            >
              {aiLoading === a ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              <span className="ml-1 capitalize">{a}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Word-like A4 page */}
      <div className="mx-auto w-full max-w-[816px] rounded-md bg-white p-10 text-black shadow-xl ring-1 ring-border sm:p-14 dark:bg-zinc-100 print:p-0 print:shadow-none print:ring-0" style={{ fontFamily: "Calibri, sans-serif", minHeight: "1056px" }}>
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
          data-placeholder="Start typing your note…"
          style={{ fontFamily: "Calibri, sans-serif", fontSize: "12pt", lineHeight: 1.5 }}
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
