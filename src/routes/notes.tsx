import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore, uid, type Note } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/notes")({
  component: () => (
    <RequireProfile>
      <Notes />
    </RequireProfile>
  ),
});

function Notes() {
  const { state, update } = useStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<Note["type"]>("note");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [slideIdx, setSlideIdx] = useState(0);

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB");
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const save = () => {
    if (!title.trim()) return toast.error("Add a title");
    if (type === "diagram" && !imageDataUrl) return toast.error("Upload an image");
    update((s) => ({
      ...s,
      notes: [{ id: uid(), title: title.trim(), content, imageDataUrl, type, createdAt: new Date().toISOString() }, ...s.notes],
    }));
    setTitle(""); setContent(""); setImageDataUrl(undefined);
    toast.success("Saved ✨");
  };

  const remove = (id: string) => update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));

  const notes = state.notes.filter((n) => n.type === "note");
  const diagrams = state.notes.filter((n) => n.type === "diagram");
  const slides = state.notes.filter((n) => n.type === "slide");

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Notes & Workspace</h1>
      <p className="mb-5 text-sm text-muted-foreground">Notes, diagrams and slides — all in one place.</p>

      <Card className="mb-5 space-y-3 p-4">
        <Tabs value={type} onValueChange={(v) => { setType(v as Note["type"]); setImageDataUrl(undefined); }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="note">Note</TabsTrigger>
            <TabsTrigger value="diagram">Diagram</TabsTrigger>
            <TabsTrigger value="slide">Slide</TabsTrigger>
          </TabsList>
          <TabsContent value="note" className="mt-3 space-y-2">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
            <Textarea placeholder="Write your note..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} maxLength={2000} />
          </TabsContent>
          <TabsContent value="diagram" className="mt-3 space-y-2">
            <Input placeholder="Diagram title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
            <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:bg-muted/50">
              <ImageIcon className="h-5 w-5" />
              {imageDataUrl ? "Change image" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </Label>
            {imageDataUrl && <img src={imageDataUrl} alt="preview" className="max-h-40 w-full rounded-lg object-contain" />}
          </TabsContent>
          <TabsContent value="slide" className="mt-3 space-y-2">
            <Input placeholder="Slide title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
            <Textarea placeholder="Slide content..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} maxLength={2000} />
          </TabsContent>
        </Tabs>
        <Button onClick={save} className="w-full bg-gradient-primary text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Save
        </Button>
      </Card>

      {/* Slides viewer */}
      {slides.length > 0 && (
        <Card className="mb-5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slides ({slideIdx + 1}/{slides.length})</p>
          <div className="rounded-xl bg-gradient-soft p-5 min-h-[140px] animate-fade-in">
            <h3 className="font-semibold">{slides[Math.min(slideIdx, slides.length - 1)].title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm">{slides[Math.min(slideIdx, slides.length - 1)].content}</p>
          </div>
          <div className="mt-3 flex justify-between">
            <Button size="sm" variant="outline" onClick={() => setSlideIdx((i) => Math.max(0, i - 1))} disabled={slideIdx === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))} disabled={slideIdx >= slides.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <Section title="Notes" items={notes} onRemove={remove} />
      <Section title="Diagrams" items={diagrams} onRemove={remove} />
    </AppShell>
  );
}

function Section({ title, items, onRemove }: { title: string; items: Note[]; onRemove: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-2">
        {items.map((n) => (
          <Card key={n.id} className="p-3 animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.title}</p>
                {n.content && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground line-clamp-3">{n.content}</p>}
                {n.imageDataUrl && <img src={n.imageDataUrl} alt={n.title} className="mt-2 max-h-48 rounded-lg object-contain" />}
              </div>
              <Button size="icon" variant="ghost" onClick={() => onRemove(n.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
