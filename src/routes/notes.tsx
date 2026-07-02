// Notes hub — two categories:
//   • My Notes: user-created rich notes (text, images, drawings, audio, tags) synced via Supabase.
//   • For You: AI-generated, curriculum-aligned notes organized by subject & topic.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef, type ChangeEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Plus, Trash2, Pin, Image as ImageIcon, PenTool, Mic, Square, X, Loader2, ChevronRight, BookOpen, Sparkles } from "lucide-react";

export const Route = createFileRoute("/notes")({
  component: () => (
    <RequireProfile>
      <NotesHub />
    </RequireProfile>
  ),
});

interface Media { kind: "image" | "drawing" | "audio"; url: string; name?: string }
interface UserNote {
  id: string;
  title: string;
  content_html: string | null;
  tags: string[];
  media: Media[];
  pinned: boolean;
  updated_at: string;
}

function NotesHub() {
  const { state } = useStore();
  const profile = state.profile;
  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Notes</h1>
        <p className="text-sm text-muted-foreground">Your notes and curriculum-ready study material.</p>
      </header>
      <Tabs defaultValue="mine">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mine">My Notes</TabsTrigger>
          <TabsTrigger value="foryou">For You ✨</TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="mt-4">
          <MyNotes />
        </TabsContent>
        <TabsContent value="foryou" className="mt-4">
          {profile ? <ForYou grade={profile.grade} curriculum={profile.curriculum} /> : <p className="text-sm">Complete your profile first.</p>}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* --------------------------------- My Notes -------------------------------- */

function MyNotes() {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserNote | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("user_notes")
      .select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setNotes(((data ?? []) as unknown) as UserNote[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createBlank() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please sign in");
    const { data, error } = await supabase.from("user_notes").insert({
      user_id: user.id, title: "Untitled", content_html: "", tags: [], media: [], pinned: false,
    }).select("*").single();
    if (error) return toast.error(error.message);
    setNotes((n) => [(data as unknown) as UserNote, ...n]);
    setEditing((data as unknown) as UserNote);
  }

  async function remove(id: string) {
    const { error } = await supabase.from("user_notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setNotes((n) => n.filter((x) => x.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  async function togglePin(n: UserNote) {
    const next = !n.pinned;
    const { error } = await supabase.from("user_notes").update({ pinned: next }).eq("id", n.id);
    if (error) return toast.error(error.message);
    setNotes((all) => [...all.map((x) => (x.id === n.id ? { ...x, pinned: next } : x))].sort((a, b) => Number(b.pinned) - Number(a.pinned)));
  }

  if (editing) {
    return <NoteEditor note={editing} onClose={() => { setEditing(null); load(); }} onDelete={() => remove(editing.id)} />;
  }

  return (
    <div className="space-y-3">
      <Button onClick={createBlank} className="w-full bg-gradient-primary text-primary-foreground">
        <Plus className="mr-1 h-4 w-4" /> New Note
      </Button>
      {loading ? (
        <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : notes.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No notes yet — tap New Note to start ✨</Card>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {notes.map((n) => (
            <Card key={n.id} className="group relative overflow-hidden p-3 transition-all hover:-translate-y-0.5 hover:shadow-glow">
              <button onClick={() => setEditing(n)} className="block w-full text-left">
                <div className="flex items-start justify-between">
                  <p className="line-clamp-1 font-semibold">{n.title || "Untitled"}</p>
                  {n.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                </div>
                {n.content_html && (
                  <p className="mt-1 line-clamp-3 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: stripHtml(n.content_html) }} />
                )}
                {n.media?.length ? (
                  <div className="mt-2 flex gap-1">
                    {n.media.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        {m.kind === "image" || m.kind === "drawing" ? <ImageIcon className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                ) : null}
                {n.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {n.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  </div>
                ) : null}
              </button>
              <div className="mt-2 flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <Button size="icon" variant="ghost" onClick={() => togglePin(n)}><Pin className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function stripHtml(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "").slice(0, 200);
  const tmp = document.createElement("div"); tmp.innerHTML = html;
  return (tmp.textContent || "").slice(0, 200);
}

/* -------------------------------- Editor --------------------------------- */

function NoteEditor({ note, onClose, onDelete }: { note: UserNote; onClose: () => void; onDelete: () => void }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content_html ?? "");
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [media, setMedia] = useState<Media[]>(note.media ?? []);
  const [tagInput, setTagInput] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function fileToDataUrl(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
    });
  }

  async function onImage(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 3 * 1024 * 1024) return toast.error("Image must be under 3MB");
    const url = await fileToDataUrl(f);
    setMedia((m) => [...m, { kind: "image", url, name: f.name }]);
  }

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(blob); });
        setMedia((m) => [...m, { kind: "audio", url }]);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start(); mediaRecRef.current = rec; setRecording(true);
    } catch { toast.error("Microphone permission needed"); }
  }
  function stopRec() { mediaRecRef.current?.stop(); setRecording(false); }

  async function save() {
    setSaving(true);
    const html = editorRef.current?.innerHTML ?? content;
    const { error } = await supabase.from("user_notes").update({
      title: title.trim() || "Untitled", content_html: html, tags, media: media as any, updated_at: new Date().toISOString(),
    }).eq("id", note.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onClose();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="flex-1 text-lg font-semibold" />
        <Button size="sm" onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-2">
        <Button size="sm" variant="ghost" onClick={() => exec("bold")} className="font-bold">B</Button>
        <Button size="sm" variant="ghost" onClick={() => exec("italic")} className="italic">I</Button>
        <Button size="sm" variant="ghost" onClick={() => exec("underline")} className="underline">U</Button>
        <Button size="sm" variant="ghost" onClick={() => exec("insertUnorderedList")}>• List</Button>
        <Button size="sm" variant="ghost" onClick={() => exec("insertOrderedList")}>1. List</Button>
        <Button size="sm" variant="ghost" onClick={() => exec("formatBlock", "h2")}>H2</Button>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded px-2 text-sm hover:bg-muted">
          <ImageIcon className="h-4 w-4" /> Image
          <input type="file" accept="image/*" className="hidden" onChange={onImage} />
        </label>
        <Button size="sm" variant="ghost" onClick={() => setDrawing(true)}><PenTool className="mr-1 h-4 w-4" />Draw</Button>
        {recording ? (
          <Button size="sm" variant="ghost" onClick={stopRec} className="text-rose-600"><Square className="mr-1 h-4 w-4" />Stop</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={startRec}><Mic className="mr-1 h-4 w-4" />Record</Button>
        )}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setContent((e.target as HTMLDivElement).innerHTML)}
        className="min-h-[240px] rounded-xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {media.map((m, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg border border-border">
              <button onClick={() => setMedia((ms) => ms.filter((_, j) => j !== i))} className="absolute right-1 top-1 z-10 rounded-full bg-background/80 p-1">
                <X className="h-3 w-3" />
              </button>
              {m.kind === "audio" ? (
                <audio controls src={m.url} className="w-full" />
              ) : (
                <img src={m.url} alt="" className="h-32 w-full object-contain" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Add a tag and press Enter" />
          <Button onClick={addTag} variant="outline">Add</Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => setTags(tags.filter((x) => x !== t))}>
              {t} <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-rose-600">
          <Trash2 className="mr-1 h-4 w-4" /> Delete
        </Button>
      </div>

      {drawing && <DrawingModal onClose={() => setDrawing(false)} onSave={(url) => { setMedia((m) => [...m, { kind: "drawing", url }]); setDrawing(false); }} />}
    </div>
  );
}

function DrawingModal({ onClose, onSave }: { onClose: () => void; onSave: (url: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState("#0f172a");

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvasRef.current!.width / r.width), y: (e.clientY - r.top) * (canvasRef.current!.height / r.height) };
  }
  function down(e: React.PointerEvent) { drawingRef.current = true; const ctx = canvasRef.current!.getContext("2d")!; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
  function move(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!; const p = pos(e);
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function up() { drawingRef.current = false; }
  function clear() {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
  }
  function save() { onSave(canvasRef.current!.toDataURL("image/png")); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg space-y-3 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Color</Label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 rounded" />
          <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} className="bg-gradient-primary text-primary-foreground">Insert</Button>
        </div>
        <canvas
          ref={canvasRef}
          width={640} height={400}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
          className="w-full touch-none rounded-lg border border-border bg-white"
        />
      </Card>
    </div>
  );
}

/* --------------------------------- For You -------------------------------- */

const SUBJECT_TOPICS: Record<string, Record<string, string[]>> = {
  primary: {
    Mathematics: ["Whole Numbers", "Fractions", "Measurement", "Shapes & Geometry", "Time & Money"],
    English: ["Nouns & Pronouns", "Verbs & Tenses", "Comprehension", "Composition Writing"],
    "Science & Technology": ["Living Things", "Weather", "Matter", "Environment"],
    "Social Studies": ["My Community", "Kenya's History", "Map Reading"],
    CRE: ["Creation Story", "The Ten Commandments", "Life of Jesus"],
    "Creative Arts": ["Colour & Design", "Music Basics", "Dance & Drama"],
  },
  lower: {
    Mathematics: ["Integers", "Fractions & Decimals", "Algebra Basics", "Geometry", "Statistics & Probability"],
    English: ["Grammar", "Poetry", "Oral Skills", "Composition & Essays"],
    "Integrated Science": ["Human Body", "Matter & Energy", "Earth & Space", "Ecology"],
    "Social Studies": ["Government", "African History", "Physical Geography"],
    CRE: ["Old Testament Stories", "New Testament", "Christian Values"],
    "Pre-Technical Studies": ["Materials", "Simple Tools", "Communication Technology"],
    Agriculture: ["Soil", "Crops", "Livestock"],
  },
  upper: {
    Mathematics: ["Algebra", "Trigonometry", "Coordinate Geometry", "Statistics", "Vectors"],
    English: ["Advanced Grammar", "Literature (Prose)", "Literature (Poetry)", "Functional Writing"],
    "Integrated Science": ["Cells & Reproduction", "Forces & Motion", "Acids & Bases", "Environmental Science"],
    "Social Studies": ["Kenyan History", "African Geography", "Governance"],
    Agriculture: ["Crop Production", "Livestock Management", "Farm Records"],
    "Business Studies": ["Business Environment", "Money & Banking", "Entrepreneurship"],
  },
  senior: {
    Mathematics: ["Functions", "Calculus", "Probability", "Matrices", "Sequences & Series"],
    Biology: ["Cell Biology", "Genetics", "Ecology", "Human Physiology"],
    Chemistry: ["Atomic Structure", "Chemical Bonding", "Acids Bases & Salts", "Organic Chemistry"],
    Physics: ["Mechanics", "Waves", "Electricity", "Modern Physics"],
    Geography: ["Climatology", "Human Geography", "Fieldwork"],
    History: ["World Wars", "Kenyan Independence", "Cold War"],
    "Business Studies": ["Marketing", "Finance", "Management"],
  },
};

function subjectPack(grade: string) {
  const n = parseInt(grade.replace(/\D/g, ""), 10) || 0;
  if (n <= 5) return SUBJECT_TOPICS.primary;
  if (n <= 8) return SUBJECT_TOPICS.lower;
  if (n <= 10) return SUBJECT_TOPICS.upper;
  return SUBJECT_TOPICS.senior;
}

function ForYou({ grade, curriculum }: { grade: string; curriculum: string }) {
  const pack = useMemo(() => subjectPack(grade), [grade]);
  const subjects = Object.keys(pack);
  const [subject, setSubject] = useState<string>(subjects[0] ?? "");
  const [topic, setTopic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState<any | null>(null);

  useEffect(() => { setTopic(""); setBody(null); }, [subject]);

  async function open(t: string) {
    setTopic(t); setLoading(true); setBody(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-curriculum-notes", {
        body: { curriculum, grade, subject, topic: t },
      });
      if (error) throw error;
      setBody(data.body);
    } catch (e: any) {
      toast.error(e.message || "Failed to load notes");
    } finally { setLoading(false); }
  }

  if (topic && (loading || body)) {
    return (
      <div className="space-y-3">
        <Button size="sm" variant="outline" onClick={() => { setTopic(""); setBody(null); }}>← All Topics</Button>
        <h2 className="text-xl font-bold">{topic}</h2>
        <p className="text-xs text-muted-foreground">{subject} • {grade} • {curriculum}</p>
        {loading ? (
          <Card className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></Card>
        ) : body ? <CurriculumNoteView body={body} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <Label className="text-xs">Subject</Label>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>
      <div className="grid grid-cols-1 gap-2">
        {(pack[subject] ?? []).map((t) => (
          <button key={t} onClick={() => open(t)}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-glow">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI curriculum notes</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function CurriculumNoteView({ body }: { body: any }) {
  const [openIdx, setOpenIdx] = useState<Record<string, boolean>>({ overview: true, sections: true, summary: true });
  const T = (k: string) => setOpenIdx((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="space-y-2">
      {body.overview && (
        <Section title="Overview" open={openIdx.overview} onToggle={() => T("overview")}>
          <p className="text-sm leading-relaxed">{body.overview}</p>
        </Section>
      )}
      {body.learningOutcomes?.length > 0 && (
        <Section title="Learning outcomes" open={!!openIdx.outcomes} onToggle={() => T("outcomes")}>
          <ul className="list-disc pl-5 text-sm space-y-1">{body.learningOutcomes.map((o: string, i: number) => <li key={i}>{o}</li>)}</ul>
        </Section>
      )}
      {body.keyTerms?.length > 0 && (
        <Section title="Key terms" open={!!openIdx.terms} onToggle={() => T("terms")}>
          <div className="space-y-2">{body.keyTerms.map((k: any, i: number) => (
            <div key={i} className="rounded-lg bg-muted/30 p-2 text-sm"><strong>{k.term}:</strong> {k.definition}</div>
          ))}</div>
        </Section>
      )}
      {body.sections?.length > 0 && (
        <Section title="Explanation" open={openIdx.sections} onToggle={() => T("sections")}>
          <div className="space-y-3">
            {body.sections.map((s: any, i: number) => (
              <div key={i}>
                <p className="font-semibold">{s.heading}</p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{s.body}</p>
                {s.example && <p className="mt-1 rounded bg-primary/5 p-2 text-sm"><em>Example:</em> {s.example}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}
      {body.diagramDescription && (
        <Section title="Diagram" open={!!openIdx.diagram} onToggle={() => T("diagram")}>
          <p className="text-sm italic text-muted-foreground">{body.diagramDescription}</p>
        </Section>
      )}
      {body.practicalActivity && (
        <Section title="Practical activity" open={!!openIdx.activity} onToggle={() => T("activity")}>
          <p className="text-sm">{body.practicalActivity}</p>
        </Section>
      )}
      {body.keyPointsSummary?.length > 0 && (
        <Section title="Key points summary" open={openIdx.summary} onToggle={() => T("summary")}>
          <ul className="list-disc pl-5 text-sm space-y-1">{body.keyPointsSummary.map((k: string, i: number) => <li key={i}>{k}</li>)}</ul>
        </Section>
      )}
      {body.flashcards?.length > 0 && (
        <Section title={`Flashcards (${body.flashcards.length})`} open={!!openIdx.cards} onToggle={() => T("cards")}>
          <Flashcards cards={body.flashcards} />
        </Section>
      )}
      {body.revisionQuestions?.length > 0 && (
        <Section title="Revision questions" open={!!openIdx.rev} onToggle={() => T("rev")}>
          <ol className="list-decimal pl-5 text-sm space-y-2">
            {body.revisionQuestions.map((r: any, i: number) => (
              <li key={i}>
                <p>{r.q}</p>
                <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Show answer</summary><p className="mt-1">{r.a}</p></details>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/50">
      <button onClick={onToggle} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-muted/50">
        <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
        {title}
      </button>
      {open && <div className="border-t border-border/60 px-3 py-3 animate-fade-in">{children}</div>}
    </div>
  );
}

function Flashcards({ cards }: { cards: { front: string; back: string }[] }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const c = cards[i];
  return (
    <div className="space-y-2">
      <button onClick={() => setFlip((f) => !f)} className="block min-h-[120px] w-full rounded-xl bg-gradient-primary/10 p-4 text-left text-sm">
        <p className="text-xs uppercase text-muted-foreground">{flip ? "Answer" : "Question"} • {i + 1}/{cards.length}</p>
        <p className="mt-2 font-medium">{flip ? c.back : c.front}</p>
        <p className="mt-3 text-xs text-muted-foreground">(tap to flip)</p>
      </button>
      <div className="flex justify-between">
        <Button size="sm" variant="outline" disabled={i === 0} onClick={() => { setI(i - 1); setFlip(false); }}>Prev</Button>
        <Button size="sm" variant="outline" disabled={i >= cards.length - 1} onClick={() => { setI(i + 1); setFlip(false); }}>Next</Button>
      </div>
    </div>
  );
}
