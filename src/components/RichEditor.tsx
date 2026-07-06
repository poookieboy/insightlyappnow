// Tiptap-powered rich note editor with a mobile-friendly formatting bar.
// Autosaves via `onChange` (parent debounces persistence).

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  List, ListOrdered, ListChecks, Quote, Heading1, Heading2, Heading3,
  Table as TableIcon, Undo2, Redo2, Type, Palette, Image as ImageIcon,
  PenTool, Mic, Square, X, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  editable?: boolean;
  onChange: (html: string) => void;
  onInsertPhoto: () => void;
  onOpenDrawing: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recording: boolean;
  textClass?: string;
  placeholder?: string;
}

const FONTS = [
  { label: "Default", value: "" },
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "ui-monospace, 'Courier New', monospace" },
  { label: "Rounded", value: "'Comic Sans MS', 'Comic Sans', cursive" },
  { label: "Display", value: "'Space Grotesk', ui-sans-serif" },
];

const COLORS = [
  "#111827", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff",
];

export function RichEditor({
  content, editable = true, onChange, onInsertPhoto, onOpenDrawing,
  onStartRecording, onStopRecording, recording, textClass, placeholder,
}: Props) {
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg my-2 max-w-full" } }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px]",
          textClass,
        ),
      },
    },
  });

  // Sync external content updates (e.g. after decryption)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== content) editor.commands.setContent(content || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" />
      {editable && (
        <FormatBar
          editor={editor}
          onInsertPhoto={onInsertPhoto}
          onOpenDrawing={onOpenDrawing}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          recording={recording}
        />
      )}
    </div>
  );
}

function FormatBar({
  editor, onInsertPhoto, onOpenDrawing, onStartRecording, onStopRecording, recording,
}: {
  editor: Editor;
  onInsertPhoto: () => void;
  onOpenDrawing: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recording: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={barRef}
      className="sticky bottom-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur-md"
    >
      {/* Compact bar */}
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-bold",
            expanded ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
          title="Formatting"
        >
          <span>Aa</span>
          <ChevronUp className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
        </button>
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullets">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist">
          <ListChecks className="h-4 w-4" />
        </ToolBtn>
        <div className="mx-1 h-6 w-px shrink-0 bg-border" />
        <ToolBtn onClick={onInsertPhoto} title="Photo"><ImageIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={onOpenDrawing} title="Draw"><PenTool className="h-4 w-4" /></ToolBtn>
        {recording ? (
          <ToolBtn onClick={onStopRecording} title="Stop" className="text-rose-600"><Square className="h-4 w-4" /></ToolBtn>
        ) : (
          <ToolBtn onClick={onStartRecording} title="Record"><Mic className="h-4 w-4" /></ToolBtn>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border/60 bg-muted/30 px-3 pb-3 pt-2 animate-fade-in">
          <div className="mb-2 flex flex-wrap gap-1">
            <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1"><Heading1 className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2"><Heading2 className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3"><Heading3 className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} title="Body"><Type className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike"><Strikethrough className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight"><Highlighter className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered"><ListOrdered className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><TableIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="h-4 w-4" /></ToolBtn>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Font</span>
            <select
              className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs"
              onChange={(e) => {
                const v = e.target.value;
                if (v) editor.chain().focus().setFontFamily(v).run();
                else editor.chain().focus().unsetFontFamily().run();
              }}
              defaultValue=""
            >
              {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
            </select>
            <span className="text-[11px] font-medium text-muted-foreground">Size</span>
            <select
              className="h-8 w-16 rounded-md border border-border bg-background px-2 text-xs"
              onChange={(e) => {
                const size = e.target.value;
                const level = size === "h1" ? 1 : size === "h2" ? 2 : size === "h3" ? 3 : null;
                if (level) editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run();
                else editor.chain().focus().setParagraph().run();
              }}
              defaultValue=""
            >
              <option value="">Body</option>
              <option value="h3">Small</option>
              <option value="h2">Medium</option>
              <option value="h1">Large</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(c).run()}
                  className="h-6 w-6 rounded-full border border-border shadow-sm"
                  style={{ background: c }}
                  aria-label={`Text color ${c}`}
                />
              ))}
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetColor().run()}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background"
                title="Reset color"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  children, onClick, title, active, className,
}: { children: React.ReactNode; onClick: () => void; title: string; active?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}
