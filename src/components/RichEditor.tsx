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
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  List, ListOrdered, ListChecks, Quote, Heading1, Heading2, Heading3,
  Table as TableIcon, Undo2, Redo2, Type, Palette, Image as ImageIcon,
  PenTool, Mic, Square, X, ChevronUp, Code2, Sigma, Smile, Paperclip,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Minus,
  Subscript as SubIcon, Superscript as SupIcon, LayoutTemplate, RemoveFormatting,
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
  /** Optional: attach any file (PDF, doc, audio…) */
  onAttachFile?: () => void;
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

const EMOJIS = [
  "😀","😅","😂","😍","🤔","😴","🤯","😎","🥳","😭",
  "👍","👏","🙌","🙏","💪","✍️","👀","🧠","❤️","🔥",
  "⭐","✅","❌","❗","❓","📌","📎","📝","📚","📖",
  "✏️","🖍️","🧪","🔬","🧬","🌍","🧮","📊","📈","💡",
  "⏰","📅","🎯","🏆","🎓","☕","🍀","🌙","☀️","🚀",
];

const MATH_SYMBOLS = [
  "±","×","÷","≈","≠","≤","≥","√","∛","∞",
  "π","θ","α","β","γ","Δ","Σ","∏","∫","∂",
  "°","′","″","∠","⊥","∥","△","∴","∵","%",
  "→","⇒","⇔","∈","∉","⊂","∪","∩","≡","∅",
  "½","¼","¾","²","³","⁴","ₓ","₁","₂","₃",
];

const TEMPLATES: { label: string; html: string }[] = [
  {
    label: "Cornell notes",
    html: `<h2>Cornell Notes</h2><table><tbody><tr><th>Cues / Questions</th><th>Notes</th></tr><tr><td><p></p></td><td><p></p></td></tr><tr><td><p></p></td><td><p></p></td></tr></tbody></table><h3>Summary</h3><p></p>`,
  },
  {
    label: "Lesson summary",
    html: `<h2>Topic</h2><h3>Key points</h3><ul><li><p></p></li><li><p></p></li><li><p></p></li></ul><h3>Definitions</h3><ul><li><p></p></li></ul><h3>Examples</h3><p></p><h3>My summary</h3><p></p>`,
  },
  {
    label: "Flashcards (Q/A)",
    html: `<h2>Flashcards</h2><blockquote><p><strong>Q:</strong> </p></blockquote><p><strong>A:</strong> </p><blockquote><p><strong>Q:</strong> </p></blockquote><p><strong>A:</strong> </p>`,
  },
  {
    label: "Study plan",
    html: `<h2>Study plan</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Revise topic 1</p></li><li data-type="taskItem" data-checked="false"><p>Practice questions</p></li><li data-type="taskItem" data-checked="false"><p>Review mistakes</p></li></ul>`,
  },
  {
    label: "Formula sheet",
    html: `<h2>Formula sheet</h2><table><tbody><tr><th>Formula</th><th>What it means</th></tr><tr><td><p></p></td><td><p></p></td></tr><tr><td><p></p></td><td><p></p></td></tr></tbody></table>`,
  },
];

export function RichEditor({
  content, editable = true, onChange, onInsertPhoto, onOpenDrawing,
  onStartRecording, onStopRecording, recording, textClass, placeholder, onAttachFile,
}: Props) {
  const [text, setText] = useState("");

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
      Subscript, Superscript,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setText(editor.getText());
    },
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
    setText(editor.getText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const minutes = Math.max(1, Math.round(words / 200));
    return { words, chars, minutes };
  }, [text]);

  if (!editor) return null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" />
      <div className="flex items-center justify-end gap-3 px-4 pb-1 text-[11px] opacity-60">
        <span>{stats.words} words</span>
        <span>{stats.chars} characters</span>
        <span>{stats.minutes} min read</span>
      </div>
      {editable && (
        <FormatBar
          editor={editor}
          onInsertPhoto={onInsertPhoto}
          onOpenDrawing={onOpenDrawing}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onAttachFile={onAttachFile}
          recording={recording}
        />
      )}
    </div>
  );
}

function FormatBar({
  editor, onInsertPhoto, onOpenDrawing, onStartRecording, onStopRecording, recording, onAttachFile,
}: {
  editor: Editor;
  onInsertPhoto: () => void;
  onOpenDrawing: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recording: boolean;
  onAttachFile?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<null | "emoji" | "math" | "template">(null);
  const barRef = useRef<HTMLDivElement>(null);

  const insert = (s: string) => editor.chain().focus().insertContent(s).run();
  const togglePanel = (p: "emoji" | "math" | "template") => setPanel((v) => (v === p ? null : p));

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (!url.trim()) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div
      ref={barRef}
      className="sticky bottom-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur-md"
    >
      {/* Compact bar */}
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2">
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
          className={cn(!editor.can().undo() && "opacity-40")}
        >
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
          className={cn(!editor.can().redo() && "opacity-40")}
        >
          <Redo2 className="h-4 w-4" />
        </ToolBtn>
        <div className="mx-1 h-6 w-px shrink-0 bg-border" />
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
        <ToolBtn active={panel === "math"} onClick={() => togglePanel("math")} title="Equations & symbols"><Sigma className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={panel === "emoji"} onClick={() => togglePanel("emoji")} title="Emoji"><Smile className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={panel === "template"} onClick={() => togglePanel("template")} title="Templates"><LayoutTemplate className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={onInsertPhoto} title="Photo"><ImageIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={onOpenDrawing} title="Draw"><PenTool className="h-4 w-4" /></ToolBtn>
        {onAttachFile && (
          <ToolBtn onClick={onAttachFile} title="Attach file"><Paperclip className="h-4 w-4" /></ToolBtn>
        )}
        {recording ? (
          <ToolBtn onClick={onStopRecording} title="Stop" className="text-rose-600"><Square className="h-4 w-4" /></ToolBtn>
        ) : (
          <ToolBtn onClick={onStartRecording} title="Record"><Mic className="h-4 w-4" /></ToolBtn>
        )}
      </div>

      {/* Symbol / emoji / template panels */}
      {panel === "math" && (
        <PickerPanel title="Equations & symbols" onClose={() => setPanel(null)}>
          <div className="mb-2 flex flex-wrap gap-1">
            <SmallBtn onClick={() => insert("<p>x = (-b ± √(b² - 4ac)) / 2a</p>")}>Quadratic</SmallBtn>
            <SmallBtn onClick={() => insert("<p>a² + b² = c²</p>")}>Pythagoras</SmallBtn>
            <SmallBtn onClick={() => insert("<p>Area = ½ × base × height</p>")}>Area △</SmallBtn>
            <SmallBtn onClick={() => editor.chain().focus().toggleCode().run()}>Inline math</SmallBtn>
            <SmallBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Equation block</SmallBtn>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {MATH_SYMBOLS.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insert(s)}
                className="h-8 rounded-md bg-background text-sm hover:bg-primary hover:text-primary-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </PickerPanel>
      )}

      {panel === "emoji" && (
        <PickerPanel title="Emoji" onClose={() => setPanel(null)}>
          <div className="grid grid-cols-10 gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => insert(e)}
                className="h-8 rounded-md text-lg hover:bg-muted"
              >
                {e}
              </button>
            ))}
          </div>
        </PickerPanel>
      )}

      {panel === "template" && (
        <PickerPanel title="Templates" onClose={() => setPanel(null)}>
          <div className="flex flex-wrap gap-1">
            {TEMPLATES.map((t) => (
              <SmallBtn key={t.label} onClick={() => { insert(t.html); setPanel(null); }}>{t.label}</SmallBtn>
            ))}
          </div>
        </PickerPanel>
      )}

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
            <ToolBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block"><Code2 className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered"><ListOrdered className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Subscript"><SubIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Superscript"><SupIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive("link")} onClick={addLink} title="Link"><LinkIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left"><AlignLeft className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center"><AlignCenter className="h-4 w-4" /></ToolBtn>
            <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right"><AlignRight className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><TableIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting"><RemoveFormatting className="h-4 w-4" /></ToolBtn>
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

function PickerPanel({
  title, children, onClose,
}: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="border-t border-border/60 bg-muted/30 px-3 pb-3 pt-2 animate-fade-in">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground"
    >
      {children}
    </button>
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
