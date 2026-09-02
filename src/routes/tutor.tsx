import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Send, Sparkles, Trash2, User, RefreshCw, Plus, Search, WifiOff,
  FolderPlus, Folder, Menu, X, Pencil, Mic, MicOff, Volume2, VolumeX,
  ImagePlus, Copy, Check, Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
// Hero avatar removed — Iris chat is now a clean grey/black surface.
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useStore, uid, type TutorConversation, type TutorMessage } from "@/lib/store";
import { cn } from "@/lib/utils";
import { humanizeMath } from "@/lib/math-format";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { toast } from "sonner";

mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

type Mode = "ask" | "explain" | "quiz" | "diagram" | "project";
const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "ask", label: "Ask", hint: "Ask anything — like ChatGPT." },
  { id: "explain", label: "Step-by-step", hint: "Get a clear, numbered walkthrough." },
  { id: "quiz", label: "Quiz me", hint: "I'll quiz you on a topic." },
  { id: "diagram", label: "Diagram", hint: "Get a chart or diagram with explanation." },
  { id: "project", label: "Project", hint: "Help with a school project." },
];

export const Route = createFileRoute("/tutor")({
  component: () => (
    <RequireProfile>
      <Tutor />
    </RequireProfile>
  ),
});

const STARTERS = [
  "Explain photosynthesis step by step",
  "Help me solve: 2x + 5 = 17",
  "Quiz me on World War 2",
  "How do I write a strong essay intro?",
];

const QUICK_CHIPS = [
  { label: "Explain a topic", text: "Explain this topic to me step by step: " },
  { label: "Quiz me", text: "Quiz me on " },
  { label: "Study plan", text: "Make me a study plan for " },
  { label: "Summarize", text: "Summarize this in simple points: " },
  { label: "Check my working", text: "Check my working and correct any mistakes: " },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor-v2`;
const CLASSIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-classify`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function Tutor() {
  const { state, update } = useStore();
  const profile = state.profile!;
  const conversations = state.tutorConversations;
  const projects = state.tutorProjects;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProjectFilter, setActiveProjectFilter] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("ask");
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectDialog, setProjectDialog] = useState<{ open: boolean; id?: string }>({ open: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceChat();
  const online = useOnlineStatus();
  const [voiceMode, setVoiceMode] = useState(false);
  const lastSpokenRef = useRef<string>("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImages = (files: FileList | null) => {
    if (!files?.length) return;
    const room = 4 - attachments.length;
    if (room <= 0) { toast.error("Up to 4 images per message."); return; }
    Array.from(files).slice(0, room).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 4 * 1024 * 1024) { toast.error(`${file.name} is larger than 4MB.`); return; }
      const reader = new FileReader();
      reader.onload = () => setAttachments((a) => [...a, String(reader.result)]);
      reader.readAsDataURL(file);
    });
  };


  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const messages: TutorMessage[] = active?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  // Auto-speak the assistant's reply when voice mode is on (only after streaming finishes)
  useEffect(() => {
    if (!voiceMode || loading) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (last.content === lastSpokenRef.current) return;
    lastSpokenRef.current = last.content;
    voice.speak(humanizeMath(last.content));
  }, [messages, loading, voiceMode, voice]);

  const ensureConversation = (firstUserText: string): TutorConversation => {
    if (active) return active;
    const conv: TutorConversation = {
      id: uid(),
      title: firstUserText.slice(0, 40) || "New chat",
      projectId: activeProjectFilter,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    update((s) => ({ ...s, tutorConversations: [conv, ...s.tutorConversations] }));
    setActiveId(conv.id);
    return conv;
  };

  const writeMessages = (id: string, msgs: TutorMessage[], titleHint?: string) => {
    update((s) => ({
      ...s,
      tutorConversations: s.tutorConversations.map((c) =>
        c.id === id
          ? {
              ...c,
              messages: msgs,
              title: titleHint && c.title === "New chat" ? titleHint.slice(0, 40) : c.title,
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    }));
  };

  const send = async (textArg?: string, imagesArg?: string[]) => {
    const text = (textArg ?? input).trim();
    const images = imagesArg ?? attachments;
    if ((!text && images.length === 0) || loading) return;
    if (!online) {
      toast("You're offline", {
        description: "Iris needs internet. Your notes, planner and revision still work offline.",
      });
      return;
    }
    setInput("");
    setAttachments([]);
    setLastFailed(null);

    const conv = ensureConversation(text || "Image question");
    const isFirstMessage = conv.messages.length === 0;
    const userMsg: TutorMessage = {
      role: "user",
      content: text || "Please look at this image and help me.",
      ...(images.length ? { images } : {}),
    };
    const next = [...conv.messages, userMsg];
    writeMessages(conv.id, next, text || "Image question");
    setLoading(true);


    // Auto-classify subject + title from the first user message
    if (isFirstMessage) {
      (async () => {
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (ANON_KEY) headers.Authorization = `Bearer ${ANON_KEY}`;
          const r = await fetch(CLASSIFY_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({ message: text }),
          });
          if (!r.ok) return;
          const { subject, title } = await r.json();
          update((s) => ({
            ...s,
            tutorConversations: s.tutorConversations.map((c) =>
              c.id === conv.id
                ? { ...c, subject: subject || c.subject, title: title || c.title }
                : c,
            ),
          }));
        } catch {/* ignore — classification is best-effort */}
      })();
    }

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      const merged: TutorMessage[] = [...next, { role: "assistant", content: assistantSoFar }];
      writeMessages(conv.id, merged);
    };

    try {
      // Project system context (if any)
      const project = conv.projectId
        ? projects.find((p) => p.id === conv.projectId)
        : null;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (ANON_KEY) headers.Authorization = `Bearer ${ANON_KEY}`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: next,
          mode,
          profile: { name: profile.name, grade: profile.grade, curriculum: profile.curriculum },
          projectInstructions: project?.instructions ?? null,
          projectName: project?.name ?? null,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Too many requests — please wait a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Tutor is unavailable right now.");
        setLastFailed(text);
        writeMessages(conv.id, next.slice(0, -1));
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsert(delta);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      if (!assistantSoFar) {
        toast.error("Tutor returned no response. Try again.");
        setLastFailed(text);
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error. Check your network and try again.");
      setLastFailed(text);
      writeMessages(conv.id, next.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(); };

  const newChat = () => {
    setActiveId(null);
    setLastFailed(null);
    setSidebarOpen(false);
  };

  const deleteConv = (id: string) => {
    update((s) => ({ ...s, tutorConversations: s.tutorConversations.filter((c) => c.id !== id) }));
    if (activeId === id) setActiveId(null);
  };

  const renameConv = (id: string) => {
    const next = prompt("Rename chat", conversations.find((c) => c.id === id)?.title ?? "");
    if (!next) return;
    update((s) => ({
      ...s,
      tutorConversations: s.tutorConversations.map((c) => (c.id === id ? { ...c, title: next } : c)),
    }));
  };

  const filteredConvs = activeProjectFilter
    ? conversations.filter((c) => c.projectId === activeProjectFilter)
    : conversations;

  const moveToProject = (convId: string, projectId: string | null) => {
    update((s) => ({
      ...s,
      tutorConversations: s.tutorConversations.map((c) =>
        c.id === convId ? { ...c, projectId } : c,
      ),
    }));
  };

  return (
    <AppShell className="theme-iris">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Chats
              </SheetTitle>
            </SheetHeader>
            <Sidebar
              conversations={filteredConvs}
              projects={projects}
              activeId={activeId}
              activeProjectFilter={activeProjectFilter}
              onSelect={(id) => { setActiveId(id); setSidebarOpen(false); }}
              onNew={newChat}
              onDelete={deleteConv}
              onRename={renameConv}
              onProjectFilter={setActiveProjectFilter}
              onAddProject={() => setProjectDialog({ open: true })}
              onEditProject={(id) => setProjectDialog({ open: true, id })}
              onMoveToProject={moveToProject}
            />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold">{active?.title ?? "Iris"}</p>
        </div>

        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={newChat} title="New chat">
          <Plus className="h-5 w-5" />
        </Button>
      </div>




      {lastFailed && (
        <Card className="mb-3 flex items-center gap-2 border-destructive/30 bg-destructive/5 p-3">
          <p className="flex-1 text-xs">Last message failed: <span className="font-medium">{lastFailed}</span></p>
          <Button size="sm" variant="outline" onClick={() => send(lastFailed)}>
            <RefreshCw className="mr-1 h-3 w-3" /> Retry
          </Button>
        </Card>
      )}

      <div className="space-y-3 pb-4">
        {messages.length === 0 && (
          <Card className="border-dashed bg-muted/40 p-5">
            <div className="mb-4 flex items-center gap-3">
              <IrisMark size="lg" />
              <div>
                <p className="font-display text-base font-semibold">Iris</p>
                <p className="text-xs text-muted-foreground">
                  Ask anything — type, attach a photo of your work, or tap the mic to talk.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-border/60 bg-card/60 p-3 text-left text-sm transition-all hover:border-primary hover:bg-card"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>
        )}

        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            msg={m}
            streaming={loading && i === messages.length - 1 && m.role === "assistant"}
            onSpeak={voice.supported ? () => (voice.speaking ? voice.stopSpeaking() : voice.speak(humanizeMath(m.content))) : undefined}
            speaking={voice.speaking}
            onRegenerate={
              !loading && m.role === "assistant" && i === messages.length - 1
                ? () => {
                    const lastUser = [...messages].reverse().find((x) => x.role === "user");
                    if (!lastUser) return;
                    writeMessages(active!.id, messages.slice(0, -1));
                    send(lastUser.content, lastUser.images);
                  }
                : undefined
            }
          />
        ))}

        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 animate-fade-in">
            <IrisMark active />
            <div className="flex items-center gap-1 rounded-2xl border bg-card px-3 py-2.5">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                  style={{ animationDelay: `${d * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={onSubmit} className="fixed bottom-20 left-0 right-0 z-30 mx-auto max-w-md px-4">
        {!online && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border bg-card/95 px-3 py-2 text-[11px] text-muted-foreground shadow-lg backdrop-blur">
            <WifiOff className="h-3.5 w-3.5" />
            Iris is offline — reconnect to keep chatting.
          </div>
        )}

        {/* Dynamic-Island style status pill — lives at the bottom, above the composer */}
        <div className="mb-2 flex justify-center">
          <div className="flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-1 shadow-md backdrop-blur">
            <IrisMark size="sm" active={loading || voice.speaking || voice.listening} />
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              {voice.listening ? "Listening…" : voice.speaking ? "Speaking…" : loading ? "Thinking…" : "Iris · Ready"}
            </span>
          </div>
        </div>

        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "press shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm backdrop-blur transition-colors",
                mode === m.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-card/90 text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {QUICK_CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setInput((v) => (v.startsWith(c.text) ? v : c.text + v))}
              className="press shrink-0 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur hover:border-primary hover:text-foreground"
            >
              {c.label}
            </button>
          ))}
        </div>
        {attachments.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto rounded-2xl border bg-card/95 p-2 shadow-lg backdrop-blur">
            {attachments.map((src, i) => (
              <div key={i} className="relative shrink-0">
                <img src={src} alt={`Attachment ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachments((a) => a.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-0.5 text-background"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1.5 rounded-2xl border bg-card p-2 shadow-lg">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => { pickImages(e.target.files); e.target.value = ""; }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0"
            onClick={() => fileRef.current?.click()}
            title="Attach an image"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Iris anything…"
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
          />
          {voice.supported && (
            <Button
              type="button"
              size="icon"
              variant={voice.listening ? "default" : "ghost"}
              onClick={() => {
                if (voice.listening) {
                  voice.stop();
                } else {
                  setVoiceMode(true);
                  voice.start((finalText) => {
                    if (finalText) send(finalText);
                  });
                }
              }}
              title={voice.listening ? "Stop listening" : "Speak to Iris"}
              className={cn(
                "h-9 w-9 shrink-0",
                voice.listening && "animate-pulse bg-red-500 text-white hover:bg-red-600",
              )}
            >
              {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          {voice.supported && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (voice.speaking) voice.stopSpeaking();
                setVoiceMode((v) => !v);
              }}
              title={voiceMode ? "Mute Iris voice" : "Read replies aloud"}
              className="h-9 w-9 shrink-0"
            >
              {voiceMode ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          )}
          {voice.speaking ? (
            <Button
              type="button"
              size="icon"
              onClick={voice.stopSpeaking}
              title="Stop speaking"
              className="h-9 w-9 shrink-0"
              variant="secondary"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={(!input.trim() && attachments.length === 0) || loading}
              className="h-9 w-9 shrink-0 bg-gradient-primary text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        {voice.listening && (
          <p className="mt-1 text-center text-[11px] text-muted-foreground animate-fade-in">
            🎙️ Listening… {voice.transcript && <span className="italic">"{voice.transcript}"</span>}
          </p>
        )}
      </form>

      <div className="h-56" />

      <ProjectDialog
        open={projectDialog.open}
        projectId={projectDialog.id}
        onClose={() => setProjectDialog({ open: false })}
      />
    </AppShell>
  );
}

function timeBucket(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86400000;
  if (d.getTime() >= startOfToday) return "Today";
  if (d.getTime() >= startOfToday - day) return "Yesterday";
  if (d.getTime() >= startOfToday - 7 * day) return "Previous 7 days";
  if (d.getTime() >= startOfToday - 30 * day) return "Previous 30 days";
  return "Older";
}
const BUCKET_ORDER = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Older"];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

function Sidebar({
  conversations, projects, activeId, activeProjectFilter,
  onSelect, onNew, onDelete, onRename, onProjectFilter, onAddProject, onEditProject, onMoveToProject,
}: {
  conversations: TutorConversation[];
  projects: { id: string; name: string }[];
  activeId: string | null;
  activeProjectFilter: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
  onProjectFilter: (id: string | null) => void;
  onAddProject: () => void;
  onEditProject: (id: string) => void;
  onMoveToProject: (convId: string, projectId: string | null) => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            (c.subject ?? "").toLowerCase().includes(q) ||
            c.messages.some((m) => m.content.toLowerCase().includes(q)),
        )
      : conversations;
    return [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [conversations, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, TutorConversation[]>();
    for (const c of results) {
      const key = timeBucket(c.updatedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return BUCKET_ORDER.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [results]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 p-3">
        <Button onClick={onNew} className="press w-full justify-start gap-2 rounded-xl bg-gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4" /> New chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="h-9 rounded-xl pl-9 text-sm"
          />
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Projects</p>
          <button onClick={onAddProject} className="press text-muted-foreground hover:text-foreground" title="New project">
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onProjectFilter(null)}
            className={cn(
              "press rounded-full border px-2.5 py-1 text-[11px]",
              activeProjectFilter === null ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground",
            )}
          >
            All chats
          </button>
          {projects.map((p) => (
            <span key={p.id} className="flex items-center">
              <button
                onClick={() => onProjectFilter(p.id)}
                className={cn(
                  "press flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]",
                  activeProjectFilter === p.id ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground",
                )}
              >
                <Folder className="h-3 w-3" />
                <span className="max-w-[90px] truncate">{p.name}</span>
              </button>
              <button
                onClick={() => onEditProject(p.id)}
                className="press ml-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Edit ${p.name}`}
              >
                <Pencil className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border-t px-2 py-2">
        {grouped.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {query ? "No chats match your search." : "No chats yet — start one!"}
          </p>
        )}
        <div className="space-y-4">
          {grouped.map(([bucket, items]) => (
            <div key={bucket}>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {bucket}
              </p>
              <div className="space-y-0.5">
                {items.map((c) => {
                  const preview = [...c.messages].reverse().find((m) => m.content)?.content ?? "";
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "group flex items-start gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-muted/70",
                        c.id === activeId && "bg-muted",
                      )}
                    >
                      <div className="mt-0.5"><IrisMark /></div>
                      <button onClick={() => onSelect(c.id)} className="min-w-0 flex-1 text-left">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">{c.title}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(c.updatedAt)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {c.subject ? `${c.subject} · ` : ""}{preview.slice(0, 60) || "No messages yet"}
                        </span>
                      </button>
                      <span className="flex shrink-0 items-center gap-1 opacity-60 group-hover:opacity-100">
                        <select
                          value={c.projectId ?? ""}
                          onChange={(e) => onMoveToProject(c.id, e.target.value || null)}
                          className="w-4 rounded bg-transparent text-[10px]"
                          title="Move to project"
                          aria-label="Move to project"
                        >
                          <option value="">No project</option>
                          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button onClick={() => onRename(c.id)} className="press text-muted-foreground hover:text-foreground" aria-label="Rename chat">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => onDelete(c.id)} className="press text-destructive" aria-label="Delete chat">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function ProjectDialog({
  open, projectId, onClose,
}: { open: boolean; projectId?: string; onClose: () => void }) {
  const { state, update } = useStore();
  const existing = projectId ? state.tutorProjects.find((p) => p.id === projectId) : null;
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (open) {
      setName(existing?.name ?? "");
      setInstructions(existing?.instructions ?? "");
    }
  }, [open, existing]);

  const save = () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    if (existing) {
      update((s) => ({
        ...s,
        tutorProjects: s.tutorProjects.map((p) =>
          p.id === existing.id ? { ...p, name: name.trim(), instructions: instructions.trim() } : p,
        ),
      }));
    } else {
      update((s) => ({
        ...s,
        tutorProjects: [
          ...s.tutorProjects,
          { id: uid(), name: name.trim(), instructions: instructions.trim(), createdAt: new Date().toISOString() },
        ],
      }));
    }
    onClose();
  };

  const remove = () => {
    if (!existing) return;
    if (!confirm("Delete this project? Chats inside it will be unassigned.")) return;
    update((s) => ({
      ...s,
      tutorProjects: s.tutorProjects.filter((p) => p.id !== existing.id),
      tutorConversations: s.tutorConversations.map((c) =>
        c.projectId === existing.id ? { ...c, projectId: null } : c,
      ),
    }));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Math Revision" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Custom instructions (optional)</label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="e.g. Always explain like I'm in Grade 7. Use simple examples."
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Sent with every chat in this project — like a custom GPT.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <div>
            {existing && (
              <Button variant="ghost" size="sm" onClick={remove} className="text-destructive">
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}><X className="mr-1 h-4 w-4" />Cancel</Button>
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground">Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageBubble({
  msg, streaming, onSpeak, speaking, onRegenerate,
}: {
  msg: TutorMessage;
  streaming?: boolean;
  onSpeak?: () => void;
  speaking?: boolean;
  onRegenerate?: () => void;
}) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(humanizeMath(msg.content));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1"><IrisMark /></div>
      )}
      <div className={cn("max-w-[85%] min-w-0", isUser ? "items-end" : "items-start")}>
        {isUser ? (
          <div className="rounded-2xl bg-gradient-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground animate-fade-in">
            {msg.images && msg.images.length > 0 && (
              <div className={cn("mb-2 grid gap-1.5", msg.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {msg.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Attached image ${i + 1}`}
                    loading="lazy"
                    className="max-h-48 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {chunks.map((chunk, i) => (
              <div
                key={i}
                className="rounded-2xl border bg-card px-3 py-2 text-sm leading-relaxed animate-fade-in"
              >
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:mt-1 prose-headings:mb-1 prose-pre:bg-muted prose-pre:text-foreground">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }) {
                        const lang = /language-(\w+)/.exec(className || "")?.[1];
                        const text = String(children).replace(/\n$/, "");
                        if (lang === "mermaid") return <Mermaid chart={text} />;
                        return <code className={className} {...props}>{children}</code>;
                      },
                    }}
                  >
                    {chunk}
                  </ReactMarkdown>
                  {streaming && i === chunks.length - 1 && (
                    <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-foreground/60 align-middle" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}


        {!isUser && !streaming && msg.content && (
          <div className="mt-1 flex items-center gap-1 pl-1">
            <button
              onClick={copy}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Copy reply"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {onSpeak && (
              <button
                onClick={onSpeak}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={speaking ? "Stop reading" : "Read aloud"}
              >
                {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            )}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Regenerate reply"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}


function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { svg } = await mermaid.render(`m-${id}`, chart);
        if (!cancelled && ref.current) { ref.current.innerHTML = svg; setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Diagram error");
      }
    })();
    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) return <pre className="overflow-x-auto rounded-lg bg-muted p-2 text-xs">{chart}</pre>;
  return <div ref={ref} className="my-2 overflow-x-auto rounded-lg border bg-card p-2 [&_svg]:mx-auto [&_svg]:max-w-full" />;
}

/** Minimal Iris identity mark — soft gradient orb, no heavy chrome. */
function IrisMark({ size = "md", active = false }: { size?: "sm" | "md" | "lg"; active?: boolean }) {
  const dim = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-11 w-11" : "h-7 w-7";
  const icon = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-sm",
        dim,
        active && "animate-pulse",
      )}
    >
      <Sparkles className={icon} />
    </span>
  );
}
