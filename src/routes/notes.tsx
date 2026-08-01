// Notes hub — EasyNotes-style rebuild.
//   • My Notes: user-created rich notes, cloud-synced (Supabase),
//     with categories, background styles, covers, icons, lock/encrypt.
//   • For You: AI-generated curriculum notes by subject & topic.

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import {
  Plus, Trash2, Search, Lock, Unlock, ChevronLeft, MoreVertical, ChevronRight,
  BookOpen, Sparkles, Loader2, Image as ImageIcon, Palette, Smile, X, Check,
  History, Share2, FileDown, Printer, Paperclip, WifiOff, RotateCcw,
} from "lucide-react";
import { RichEditor } from "@/components/RichEditor";
import { DrawingModal } from "@/components/DrawingModal";
import { NOTE_BACKGROUNDS, NOTE_ICONS, autoBackground, getBackground, type NoteBackground } from "@/lib/note-backgrounds";
import { encryptContent, decryptContent, hashPin, verifyPin } from "@/lib/note-crypto";
import { uploadAttachment, resolveMedia, removeAttachment } from "@/lib/note-storage";
import {
  getVersions, pushVersion, cacheNote, readCachedNote, buildExportHtml, htmlToPlainText,
  type NoteVersion,
} from "@/lib/note-history";


export const Route = createFileRoute("/notes")({
  component: () => (
    <RequireProfile>
      <NotesHub />
    </RequireProfile>
  ),
});

interface Category {
  id: string;
  name: string;
  color: string;
  is_locked: boolean;
  password_hash: string | null;
  sort_order: number;
}

interface UserNote {
  id: string;
  title: string;
  content_html: string | null;
  tags: string[];
  media: unknown[];
  pinned: boolean;
  category_id: string | null;
  background_style: string | null;
  cover_image: string | null;
  icon: string | null;
  is_locked: boolean;
  password_hash: string | null;
  is_encrypted: boolean;
  encrypted_payload: string | null;
  updated_at: string;
}

function NotesHub() {
  const { state } = useStore();
  const profile = state.profile;
  return (
    <AppShell wide>
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Notes</h1>
        <p className="text-sm text-muted-foreground">Your personal notes and curriculum-ready study material.</p>
      </header>
      <Tabs defaultValue="mine">
        <TabsList className="grid w-full max-w-md grid-cols-2">
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

/* ============================== My Notes ============================== */

const CATEGORY_COLORS = [
  "#fcd34d", "#f97316", "#ef4444", "#ec4899", "#a855f7",
  "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#84cc16",
  "#78716c", "#0f172a",
];

const CATEGORY_ALL = "__all__";
const CATEGORY_UNSORTED = "__unsorted__";

function MyNotes() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>(CATEGORY_ALL);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UserNote | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [showCatDialog, setShowCatDialog] = useState(false);
  // Categories the user has already unlocked this session.
  const [unlockedCats, setUnlockedCats] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: notesData, error: e1 }, { data: catsData, error: e2 }] = await Promise.all([
      supabase.from("user_notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false }),
      supabase.from("note_categories").select("*").order("sort_order").order("created_at"),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setNotes((notesData ?? []) as unknown as UserNote[]);
    setCategories((catsData ?? []) as unknown as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createNote(categoryId: string | null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please sign in");
    const bg = autoBackground(crypto.randomUUID());
    const { data, error } = await supabase.from("user_notes").insert({
      user_id: user.id,
      title: "",
      content_html: "",
      tags: [],
      media: [],
      pinned: false,
      category_id: categoryId,
      background_style: bg.id,
      cover_image: null,
      icon: null,
    }).select("*").single();
    if (error) return toast.error(error.message);
    const n = data as unknown as UserNote;
    setNotes((all) => [n, ...all]);
    setEditing(n);
  }

  async function saveCategory(cat: { id?: string; name: string; color: string; pin?: string | null; lock?: boolean }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const password_hash = cat.lock ? (cat.pin ? await hashPin(cat.pin) : null) : null;
    if (cat.id) {
      const { error } = await supabase.from("note_categories").update({
        name: cat.name, color: cat.color,
        ...(cat.lock !== undefined ? { is_locked: cat.lock, password_hash } : {}),
      }).eq("id", cat.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("note_categories").insert({
        name: cat.name, color: cat.color,
        is_locked: !!cat.lock, password_hash,
        user_id: user.id, sort_order: categories.length,
      });
      if (error) { toast.error(error.message); return; }
    }
    await load();
    setShowCatDialog(false);
    setEditCat(null);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Notes inside will move to Unsorted.")) return;
    const { error } = await supabase.from("note_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setUnlockedCats((s) => { const n = new Set(s); n.delete(id); return n; });
    if (activeCat === id) setActiveCat(CATEGORY_ALL);
    await load();
  }

  async function tryUnlockCategory(cat: Category) {
    const pin = prompt(`Enter PIN for "${cat.name}"`);
    if (!pin) return;
    if (!cat.password_hash) { setUnlockedCats((s) => new Set(s).add(cat.id)); setActiveCat(cat.id); return; }
    if (await verifyPin(pin, cat.password_hash)) {
      setUnlockedCats((s) => new Set(s).add(cat.id));
      setActiveCat(cat.id);
    } else {
      toast.error("Wrong PIN");
    }
  }

  const filteredNotes = useMemo(() => {
    let arr = notes;
    if (activeCat === CATEGORY_UNSORTED) arr = arr.filter((n) => !n.category_id);
    else if (activeCat !== CATEGORY_ALL) arr = arr.filter((n) => n.category_id === activeCat);
    // Hide notes in locked (still-locked) categories from "All"
    if (activeCat === CATEGORY_ALL) {
      const lockedCats = new Set(categories.filter((c) => c.is_locked && !unlockedCats.has(c.id)).map((c) => c.id));
      arr = arr.filter((n) => !n.category_id || !lockedCats.has(n.category_id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((n) => {
        const title = (n.title || "").toLowerCase();
        const preview = n.is_encrypted ? "" : stripHtml(n.content_html || "").toLowerCase();
        return title.includes(q) || preview.includes(q);
      });
    }
    return arr;
  }, [notes, activeCat, search, categories, unlockedCats]);

  const activeCategoryObj = categories.find((c) => c.id === activeCat) ?? null;

  if (editing) {
    return (
      <NoteEditor
        note={editing}
        categories={categories}
        onClose={() => { setEditing(null); load(); }}
        onDelete={async () => {
          await supabase.from("user_notes").delete().eq("id", editing.id);
          setEditing(null); load();
        }}
      />
    );
  }

  return (
    <div className="relative min-h-[70vh] pb-24">
      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          className="h-11 pl-10"
        />
      </div>

      {/* Category chips */}
      <div className="mb-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        <CatChip
          label="All"
          color="var(--primary)"
          active={activeCat === CATEGORY_ALL}
          onClick={() => setActiveCat(CATEGORY_ALL)}
        />
        <CatChip
          label="Unsorted"
          color="#94a3b8"
          active={activeCat === CATEGORY_UNSORTED}
          onClick={() => setActiveCat(CATEGORY_UNSORTED)}
        />
        {categories.map((c) => {
          const locked = c.is_locked && !unlockedCats.has(c.id);
          return (
            <CatChip
              key={c.id}
              label={c.name}
              color={c.color}
              active={activeCat === c.id}
              locked={locked}
              onClick={() => {
                if (locked) tryUnlockCategory(c);
                else setActiveCat(c.id);
              }}
              onLongPress={() => { setEditCat(c); setShowCatDialog(true); }}
            />
          );
        })}
        <button
          onClick={() => { setEditCat(null); setShowCatDialog(true); }}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-border bg-background px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" /> New tab
        </button>
      </div>

      {activeCategoryObj && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: activeCategoryObj.color }} />
            <p className="text-sm font-semibold">{activeCategoryObj.name}</p>
            {activeCategoryObj.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => { setEditCat(activeCategoryObj); setShowCatDialog(true); }}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => deleteCategory(activeCategoryObj.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      )}

      {/* Notes grid */}
      {loading ? (
        <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState onNew={() => createNote(activeCat === CATEGORY_ALL || activeCat === CATEGORY_UNSORTED ? null : activeCat)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredNotes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              category={categories.find((c) => c.id === n.category_id) ?? null}
              onOpen={() => setEditing(n)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => createNote(activeCat === CATEGORY_ALL || activeCat === CATEGORY_UNSORTED ? null : activeCat)}
        aria-label="New note"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showCatDialog && (
        <CategoryDialog
          category={editCat}
          onClose={() => { setShowCatDialog(false); setEditCat(null); }}
          onSave={saveCategory}
        />
      )}
    </div>
  );
}

function CatChip({
  label, color, active, locked, onClick, onLongPress,
}: {
  label: string; color: string; active: boolean; locked?: boolean;
  onClick: () => void; onLongPress?: () => void;
}) {
  const timerRef = useRef<number | null>(null);
  const start = () => {
    if (!onLongPress) return;
    timerRef.current = window.setTimeout(onLongPress, 500);
  };
  const clear = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  return (
    <button
      onClick={onClick}
      onPointerDown={start}
      onPointerUp={clear}
      onPointerLeave={clear}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "border-transparent text-white shadow-sm"
          : "border-border bg-background text-foreground hover:bg-muted"
      }`}
      style={active ? { background: color } : undefined}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-white/80" : ""}`} style={!active ? { background: color } : undefined} />
      {label}
      {locked && <Lock className="h-3 w-3" />}
    </button>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary text-4xl shadow-glow">
        📝
      </div>
      <p className="font-display text-lg font-bold">Your notes will bloom here</p>
      <p className="max-w-xs text-xs text-muted-foreground">Tap + to create a colorful note. Everything autosaves and syncs to your account.</p>
      <Button onClick={onNew} className="bg-gradient-primary text-primary-foreground">
        <Plus className="mr-1.5 h-4 w-4" /> Create your first note
      </Button>
    </div>
  );
}

function NoteCard({
  note, category, onOpen,
}: { note: UserNote; category: Category | null; onOpen: () => void }) {
  const bg = getBackground(note.background_style ?? autoBackground(note.id).id);
  const preview = note.is_encrypted ? "🔒 Locked note" : stripHtml(note.content_html || "");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    if (note.cover_image) {
      resolveMedia(note.cover_image).then((u) => { if (!cancel) setCoverUrl(u); });
    } else {
      setCoverUrl(null);
    }
    return () => { cancel = true; };
  }, [note.cover_image]);

  return (
    <button
      onClick={onOpen}
      className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl text-left shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-lg animate-fade-in"
      style={{
        background: coverUrl ? `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%), url(${coverUrl}) center/cover` : bg.css,
        color: coverUrl || bg.text === "light" ? "#fff" : "#111827",
      }}
    >
      {/* Category tag */}
      {category && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: category.color }} />
          {category.name}
        </div>
      )}
      {note.is_locked && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm">
          <Lock className="h-3 w-3" />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-end p-3">
        {note.icon && <span className="mb-1 text-2xl">{note.icon}</span>}
        <p className="line-clamp-2 text-sm font-bold leading-snug">
          {note.title || "Untitled"}
        </p>
        {preview && !coverUrl && (
          <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed opacity-80">
            {preview}
          </p>
        )}
        <p className="mt-1.5 text-[10px] opacity-70">
          {new Date(note.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </div>
    </button>
  );
}

function stripHtml(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "").slice(0, 200);
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200);
}

/* ============================== Category dialog ============================== */

function CategoryDialog({
  category, onClose, onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (c: { id?: string; name: string; color: string; lock?: boolean; pin?: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [lock, setLock] = useState(category?.is_locked ?? false);
  const [pin, setPin] = useState("");

  const submit = async () => {
    if (!name.trim()) return toast.error("Name required");
    if (lock && !category?.password_hash && !pin.trim()) return toast.error("Set a PIN to lock");
    await onSave({ id: category?.id, name: name.trim(), color, lock, pin: pin || null });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? "Edit tab" : "New tab"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Math, Personal, Goals…" autoFocus />
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${color === c ? "scale-110 border-foreground" : "border-transparent"}`}
                  style={{ background: c }}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} />
              <span className="text-sm font-medium">Lock this tab with a PIN</span>
            </label>
            {lock && !category?.password_hash && (
              <Input
                type="password"
                placeholder="Choose a PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-2"
              />
            )}
            {lock && category?.password_hash && (
              <p className="mt-2 text-[11px] text-muted-foreground">Already protected. Uncheck to remove lock.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-primary text-primary-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================== Editor ============================== */

function NoteEditor({
  note, categories, onClose, onDelete,
}: {
  note: UserNote;
  categories: Category[];
  onClose: () => void;
  onDelete: () => void;
}) {
  // Unlock flow for encrypted notes.
  const [unlocked, setUnlocked] = useState(!note.is_encrypted);
  const [pinAttempt, setPinAttempt] = useState("");
  const [pinInSession, setPinInSession] = useState<string | null>(null);

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState<string>(note.content_html ?? "");
  const [bgId, setBgId] = useState<string>(note.background_style ?? autoBackground(note.id).id);
  const [icon, setIcon] = useState<string | null>(note.icon);
  const [coverPath, setCoverPath] = useState<string | null>(note.cover_image);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(note.category_id);
  const [showBg, setShowBg] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("saved");
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [offline, setOffline] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const firstRenderRef = useRef(true);

  // Offline awareness — fall back to the cached copy when there's no network.
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (!navigator.onLine && !note.is_encrypted) {
      const cached = readCachedNote(note.id);
      if (cached && !note.content_html) setContent(cached.html);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);


  const bg = getBackground(bgId);

  // Load cover signed URL
  useEffect(() => {
    let cancel = false;
    if (coverPath) resolveMedia(coverPath).then((u) => { if (!cancel) setCoverUrl(u); });
    else setCoverUrl(null);
    return () => { cancel = true; };
  }, [coverPath]);

  // Decrypt on unlock.
  async function tryUnlock() {
    if (!note.encrypted_payload || !note.password_hash) return;
    if (!(await verifyPin(pinAttempt, note.password_hash))) {
      setDecryptError("Wrong PIN"); return;
    }
    try {
      const html = await decryptContent(note.encrypted_payload, pinAttempt);
      setContent(html);
      setPinInSession(pinAttempt);
      setUnlocked(true);
      setDecryptError(null);
    } catch {
      setDecryptError("Failed to decrypt");
    }
  }

  // Autosave (debounced ~1s)
  const schedule = useCallback(() => {
    if (!unlocked) return;
    setSaving("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      const encPayload = note.is_encrypted && pinInSession
        ? await encryptContent(content, pinInSession) : null;
      const { error } = await supabase.from("user_notes").update({
        title: title.trim(),
        tags: [],
        background_style: bgId,
        cover_image: coverPath,
        icon,
        category_id: categoryId,
        updated_at: new Date().toISOString(),
        content_html: encPayload ? "" : content,
        encrypted_payload: encPayload,
      }).eq("id", note.id);
      setSaving(error ? "idle" : "saved");
      if (error) toast.error(error.message);
      else {
        pushVersion(note.id, title.trim() || "Untitled", content);
        if (!note.is_encrypted) cacheNote(note.id, title.trim() || "Untitled", content);
      }
    }, 900);

  }, [title, content, bgId, coverPath, icon, categoryId, unlocked, note.id, note.is_encrypted, pinInSession]);

  useEffect(() => {
    if (firstRenderRef.current) { firstRenderRef.current = false; return; }
    schedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, bgId, coverPath, icon, categoryId]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    const t = toast.loading("Uploading photo…");
    try {
      const { url } = await uploadAttachment(f, { folder: note.id });
      setContent((c) => c + `<p><img src="${url}" alt="" /></p>`);
      toast.success("Photo added", { id: t });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed", { id: t });
    }
  }

  async function onPickCover(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    const t = toast.loading("Uploading cover…");
    try {
      if (coverPath && !coverPath.startsWith("http")) await removeAttachment(coverPath);
      const { path } = await uploadAttachment(f, { folder: "covers" });
      setCoverPath(path);
      toast.success("Cover set", { id: t });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed", { id: t });
    }
  }

  async function onSaveDrawing(blob: Blob) {
    const t = toast.loading("Saving drawing…");
    try {
      const { url } = await uploadAttachment(blob, { folder: note.id, ext: "png" });
      setContent((c) => c + `<p><img src="${url}" alt="drawing" /></p>`);
      toast.success("Drawing added", { id: t });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed", { id: t });
    }
    setDrawing(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const t = toast.loading("Uploading audio…");
        try {
          const { url } = await uploadAttachment(blob, { folder: note.id, ext: "webm" });
          setContent((c) => c + `<p><audio controls src="${url}"></audio></p>`);
          toast.success("Audio saved", { id: t });
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : "Upload failed", { id: t });
        }
      };
      rec.start();
      mediaRecRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone permission needed");
    }
  }
  function stopRecording() { mediaRecRef.current?.stop(); setRecording(false); }

  async function toggleLock() {
    if (note.is_locked) {
      if (!confirm("Remove PIN from this note? Content will be readable without a password.")) return;
      const { error } = await supabase.from("user_notes").update({
        is_locked: false, password_hash: null,
        is_encrypted: false, encrypted_payload: null,
        content_html: content,
      }).eq("id", note.id);
      if (error) return toast.error(error.message);
      toast.success("Unlocked");
      onClose();
    } else {
      const pin = prompt("Set a PIN for this note (keep it safe — content is encrypted with it and cannot be recovered)");
      if (!pin) return;
      const confirm2 = prompt("Confirm PIN");
      if (pin !== confirm2) return toast.error("PINs do not match");
      const payload = await encryptContent(content, pin);
      const hash = await hashPin(pin);
      const { error } = await supabase.from("user_notes").update({
        is_locked: true, password_hash: hash,
        is_encrypted: true, encrypted_payload: payload,
        content_html: "",
      }).eq("id", note.id);
      if (error) return toast.error(error.message);
      toast.success("Note locked & encrypted");
      onClose();
    }
  }

  // Locked view: prompt for PIN before showing content.
  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background p-6">
        <Button variant="ghost" size="sm" onClick={onClose} className="absolute left-4 top-4">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="font-display text-xl font-bold">Note is locked</h2>
        <p className="text-sm text-muted-foreground">Enter PIN to unlock</p>
        <Input
          type="password"
          value={pinAttempt}
          onChange={(e) => setPinAttempt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          className="max-w-xs text-center text-lg tracking-widest"
          autoFocus
        />
        {decryptError && <p className="text-xs text-destructive">{decryptError}</p>}
        <Button onClick={tryUnlock} className="bg-gradient-primary text-primary-foreground">Unlock</Button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col animate-fade-in"
      style={{ background: bg.css, color: bg.text === "light" ? "#fff" : "#111827" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-black/10 bg-white/40 px-3 py-2 backdrop-blur-md dark:bg-black/20">
        <Button size="icon" variant="ghost" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-xs font-medium opacity-70">
          {saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : ""}
        </span>
        <div className="flex-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost"><MoreVertical className="h-5 w-5" /></Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            <MenuItem icon={<Palette className="h-4 w-4" />} label="Background" onClick={() => setShowBg(true)} />
            <MenuItem icon={<ImageIcon className="h-4 w-4" />} label="Cover image" onClick={() => coverInputRef.current?.click()} />
            {coverPath && (
              <MenuItem icon={<X className="h-4 w-4" />} label="Remove cover" onClick={() => setCoverPath(null)} />
            )}
            <MenuItem icon={<Smile className="h-4 w-4" />} label="Icon" onClick={() => setShowIcon(true)} />
            <MenuItem
              icon={note.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              label={note.is_locked ? "Remove lock" : "Lock with PIN"}
              onClick={toggleLock}
            />
            <div className="my-1 h-px bg-border" />
            <MenuItem
              icon={<Trash2 className="h-4 w-4 text-destructive" />}
              label="Delete note"
              onClick={() => { if (confirm("Delete this note?")) onDelete(); }}
              danger
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Category selector */}
      <div className="flex items-center gap-2 border-b border-black/10 bg-white/30 px-3 py-1.5 backdrop-blur-md dark:bg-black/10">
        <Label className="text-[11px] font-semibold uppercase tracking-wider opacity-70">Tab</Label>
        <Select value={categoryId ?? "none"} onValueChange={(v) => setCategoryId(v === "none" ? null : v)}>
          <SelectTrigger className="h-7 w-auto min-w-[8rem] border-none bg-white/60 text-xs dark:bg-black/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unsorted</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cover */}
      {coverUrl && (
        <div className="relative h-32 shrink-0 sm:h-48" style={{ background: `url(${coverUrl}) center/cover` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Title + icon */}
      <div className="flex items-center gap-2 px-4 pt-4">
        <button
          onClick={() => setShowIcon(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 text-2xl backdrop-blur-md dark:bg-black/20"
        >
          {icon ?? "＋"}
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="min-w-0 flex-1 border-none bg-transparent text-2xl font-bold placeholder:opacity-50 focus:outline-none"
          style={{ color: "inherit" }}
        />
      </div>

      {/* Editor */}
      <div className="flex min-h-0 flex-1 flex-col">
        <RichEditor
          content={content}
          onChange={setContent}
          onInsertPhoto={() => photoInputRef.current?.click()}
          onOpenDrawing={() => setDrawing(true)}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          recording={recording}
          textClass={bg.text === "light" ? "prose-invert" : ""}
          placeholder="Start writing your thoughts…"
        />
      </div>

      <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
      <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={onPickCover} />

      {drawing && <DrawingModal onClose={() => setDrawing(false)} onSave={onSaveDrawing} />}
      {showBg && <BackgroundPicker current={bgId} onPick={(id) => { setBgId(id); setShowBg(false); }} onClose={() => setShowBg(false)} />}
      {showIcon && <IconPicker onPick={(i) => { setIcon(i); setShowIcon(false); }} onClose={() => setShowIcon(false)} />}
    </div>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted ${danger ? "text-destructive" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ============================== Pickers ============================== */

function BackgroundPicker({
  current, onPick, onClose,
}: { current: string; onPick: (id: string) => void; onClose: () => void }) {
  const groups: { key: NoteBackground["group"]; label: string }[] = [
    { key: "solid", label: "Colors" },
    { key: "gradient", label: "Gradients" },
    { key: "pattern", label: "Patterns" },
    { key: "paper", label: "Paper" },
  ];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Choose a background</DialogTitle></DialogHeader>
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                {NOTE_BACKGROUNDS.filter((b) => b.group === g.key).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onPick(b.id)}
                    aria-label={b.label}
                    title={b.label}
                    className={`relative aspect-square rounded-lg border-2 transition-transform hover:scale-105 ${current === b.id ? "border-primary" : "border-transparent"}`}
                    style={{ background: b.css }}
                  >
                    {current === b.id && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                        <Check className="h-4 w-4 text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IconPicker({
  onPick, onClose,
}: { onPick: (icon: string | null) => void; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Choose an icon</DialogTitle></DialogHeader>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          <button
            onClick={() => onPick(null)}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted"
          >
            None
          </button>
          {NOTE_ICONS.map((i) => (
            <button
              key={i}
              onClick={() => onPick(i)}
              className="flex aspect-square items-center justify-center rounded-lg text-2xl hover:bg-muted"
            >
              {i}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================== For You ============================== */

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
  const [body, setBody] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { setTopic(""); setBody(null); }, [subject]);

  async function open(t: string) {
    setTopic(t); setLoading(true); setBody(null);
    try {
    const { data, error } = await supabase.functions.invoke("ai-curriculum-notes", {
  body: { curriculum, grade, subject, topic: t },
});

console.log("AI Function Data:", data);
console.log("AI Function Error:", error);

if (error) {
  toast.error(JSON.stringify(error));
  throw error;
}

setBody(data.body);  
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load notes");
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(pack[subject] ?? []).map((t) => (
          <button
            key={t}
            onClick={() => open(t)}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-glow"
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> AI curriculum notes
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function CurriculumNoteView({ body }: { body: Record<string, unknown> }) {
  const [openIdx, setOpenIdx] = useState<Record<string, boolean>>({ overview: true, sections: true, summary: true });
  const T = (k: string) => setOpenIdx((o) => ({ ...o, [k]: !o[k] }));
  const b = body as Record<string, unknown>;
  const arr = (k: string) => (b[k] as unknown[]) ?? [];

  return (
    <div className="space-y-2">
      {typeof b.overview === "string" && (
        <Section title="Overview" open={openIdx.overview} onToggle={() => T("overview")}>
          <p className="text-sm leading-relaxed">{b.overview}</p>
        </Section>
      )}
      {arr("learningOutcomes").length > 0 && (
        <Section title="Learning outcomes" open={!!openIdx.outcomes} onToggle={() => T("outcomes")}>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {(arr("learningOutcomes") as string[]).map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </Section>
      )}
      {arr("keyTerms").length > 0 && (
        <Section title="Key terms" open={!!openIdx.terms} onToggle={() => T("terms")}>
          <div className="space-y-2">
            {(arr("keyTerms") as { term: string; definition: string }[]).map((k, i) => (
              <div key={i} className="rounded-lg bg-muted/30 p-2 text-sm"><strong>{k.term}:</strong> {k.definition}</div>
            ))}
          </div>
        </Section>
      )}
      {arr("sections").length > 0 && (
        <Section title="Explanation" open={openIdx.sections} onToggle={() => T("sections")}>
          <div className="space-y-3">
            {(arr("sections") as { heading: string; body: string; example?: string }[]).map((s, i) => (
              <div key={i}>
                <p className="font-semibold">{s.heading}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{s.body}</p>
                {s.example && <p className="mt-1 rounded bg-primary/5 p-2 text-sm"><em>Example:</em> {s.example}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}
      {arr("keyPointsSummary").length > 0 && (
        <Section title="Key points summary" open={openIdx.summary} onToggle={() => T("summary")}>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {(arr("keyPointsSummary") as string[]).map((k, i) => <li key={i}>{k}</li>)}
          </ul>
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
