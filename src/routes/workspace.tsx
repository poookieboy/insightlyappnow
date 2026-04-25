import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo2, Redo2, Save, FileText, Type,
  Heading1, Heading2, Heading3, Palette, Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStore, uid } from "@/lib/store";

export const Route = createFileRoute("/workspace")({
  component: () => (
    <RequireProfile>
      <Workspace />
    </RequireProfile>
  ),
});

const FONTS = ["Inter", "Arial", "Georgia", "Times New Roman", "Courier New", "Verdana"];
const SIZES = ["1", "2", "3", "4", "5", "6", "7"];
const COLORS = ["#000000", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

function Workspace() {
  const { state, update } = useStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("Untitled document");
  const [font, setFont] = useState("Inter");
  const [size, setSize] = useState("3");
  const [wordCount, setWordCount] = useState(0);

  // Restore draft
  useEffect(() => {
    if (!state.hydrated) return;
    const draft = typeof window !== "undefined" ? localStorage.getItem("studentsync:draft") : null;
    if (draft && editorRef.current) {
      const parsed = JSON.parse(draft);
      setTitle(parsed.title || "Untitled document");
      editorRef.current.innerHTML = parsed.html || "";
      updateCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hydrated]);

  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraft = () => {
    if (typeof window === "undefined" || !editorRef.current) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    const html = editorRef.current.innerHTML;
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          "studentsync:draft",
          JSON.stringify({ title, html }),
        );
      } catch { /* ignore quota */ }
    }, 400);
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    updateCount();
    saveDraft();
  };

  const updateCount = () => {
    const text = editorRef.current?.innerText.trim() ?? "";
    setWordCount(text ? text.split(/\s+/).length : 0);
  };

  useEffect(() => {
    saveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const handleSave = () => {
    const html = editorRef.current?.innerHTML ?? "";
    const text = editorRef.current?.innerText.trim() ?? "";
    if (!text) {
      toast.error("Document is empty");
      return;
    }
    update((s) => ({
      ...s,
      notes: [
        {
          id: uid(),
          title: title || "Untitled document",
          content: html,
          createdAt: new Date().toISOString(),
          type: "note",
        },
        ...s.notes,
      ],
    }));
    toast.success("Saved to Notes ✨");
  };

  const handleClear = () => {
    if (!editorRef.current) return;
    if (!confirm("Clear the document?")) return;
    editorRef.current.innerHTML = "";
    setTitle("Untitled document");
    updateCount();
    saveDraft();
  };

  return (
    <AppShell>
      {/* Title bar */}
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-9 border-none bg-transparent px-1 text-base font-semibold focus-visible:ring-1"
        />
      </div>

      {/* Toolbar */}
      <div className="mb-3 rounded-2xl border bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("undo")} title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("redo")} title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Select
            value={font}
            onValueChange={(v) => {
              setFont(v);
              exec("fontName", v);
            }}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={size}
            onValueChange={(v) => {
              setSize(v);
              exec("fontSize", v);
            }}
          >
            <SelectTrigger className="h-8 w-[64px] text-xs">
              <Type className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("bold")} title="Bold">
            <Bold className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("italic")} title="Italic">
            <Italic className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("underline")} title="Underline">
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("strikeThrough")} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("formatBlock", "<h1>")} title="Heading 1">
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("formatBlock", "<h2>")} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("formatBlock", "<h3>")} title="Heading 3">
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("formatBlock", "<p>")} title="Paragraph">
            <span className="text-xs font-bold">P</span>
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("justifyLeft")} title="Align left">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("justifyCenter")} title="Center">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("justifyRight")} title="Align right">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("justifyFull")} title="Justify">
            <AlignJustify className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("insertUnorderedList")} title="Bullet list">
            <List className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exec("insertOrderedList")} title="Numbered list">
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <div className="flex items-center gap-1">
            <Palette className="h-4 w-4 text-muted-foreground" />
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => exec("foreColor", c)}
                className="h-5 w-5 rounded-full border border-border transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
                title={c}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Paper canvas */}
      <div className="mx-auto w-full max-w-[816px] rounded-md bg-white p-6 text-black shadow-lg ring-1 ring-border sm:p-10 dark:bg-zinc-100">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            updateCount();
            saveDraft();
          }}
          className="ds-doc min-h-[60vh] outline-none"
          style={{ fontFamily: font }}
          data-placeholder="Start typing your document…"
        />
      </div>

      {/* Status bar */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{wordCount} words · auto-saved</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleClear}>
            <Trash2 className="mr-1 h-4 w-4" /> Clear
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" /> Save to Notes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
