import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Heart, ChevronRight, LogOut, Camera, Loader2, PlayCircle, Shield, Info,
  FileText, ShieldCheck, KeyRound, User, GraduationCap, RefreshCw, Crown,
  Trash2, Check, CloudOff, Cloud, BellRing, Sparkles,
} from "lucide-react";
import { DevicePermissions } from "@/components/DevicePermissions";
import { IntroTutorial } from "@/components/IntroTutorial";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore, resetAll, type Curriculum, type Grade } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, notifyProfileChanged } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useSyncStatus } from "@/hooks/useCloudSync";
import { syncNow } from "@/lib/cloud-sync";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Insightly" },
      { name: "description", content: "Manage your Insightly profile, learning setup, device permissions, subscription and account." },
      { property: "og:title", content: "Settings — Insightly" },
      { property: "og:description", content: "Manage your Insightly profile, learning setup, device permissions, subscription and account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireProfile>
      <Settings />
    </RequireProfile>
  ),
});

const CURRICULA: Curriculum[] = ["CBC", "IGCSE", "Cambridge", "British", "American", "IB"];
const GRADES: Grade[] = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}` as Grade);

type Tile =
  | "blue" | "teal" | "green" | "amber" | "orange" | "red" | "violet" | "pink" | "slate";

const TILE_BG: Record<Tile, string> = {
  blue: "bg-tile-blue",
  teal: "bg-tile-teal",
  green: "bg-tile-green",
  amber: "bg-tile-amber",
  orange: "bg-tile-orange",
  red: "bg-tile-red",
  violet: "bg-tile-violet",
  pink: "bg-tile-pink",
  slate: "bg-tile-slate",
};

function TileIcon({ tile, icon: Icon }: { tile: Tile; icon: typeof User }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.55rem] text-tile-foreground shadow-sm",
        TILE_BG[tile],
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
    </span>
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      {title && (
        <h2 className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      )}
      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-border">{children}</ul>
      </Card>
    </section>
  );
}

interface RowProps {
  tile: Tile;
  icon: typeof User;
  label: string;
  value?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
}

function Row({ tile, icon, label, value, to, onClick, danger }: RowProps) {
  const inner = (
    <div className="press flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted">
      <TileIcon tile={tile} icon={icon} />
      <span className={cn("min-w-0 flex-1 truncate text-[15px]", danger && "text-destructive")}>{label}</span>
      {value !== undefined && (
        <span className="max-w-[45%] shrink-0 truncate text-sm text-muted-foreground">{value}</span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
    </div>
  );

  return (
    <li>
      {to ? (
        <Link to={to} className="block">{inner}</Link>
      ) : (
        <button type="button" onClick={onClick} className="block w-full">{inner}</button>
      )}
    </li>
  );
}

function PanelRow({ tile, icon, label, children }: { tile: Tile; icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <li className="px-4 py-3">
      <div className="mb-3 flex items-center gap-3">
        <TileIcon tile={tile} icon={icon} />
        <span className="text-[15px] font-medium">{label}</span>
      </div>
      {children}
    </li>
  );
}

function Settings() {
  const { state, update } = useStore();
  const navigate = useNavigate();
  const profile = state.profile!;
  const { user } = useAuth();
  const { profile: dbProfile, refresh } = useProfile();
  const { info } = useSubscription();
  const sync = useSyncStatus();

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [permsOpen, setPermsOpen] = useState(false);

  const [name, setName] = useState(profile.name);
  const [curriculum, setCurriculum] = useState<Curriculum>(profile.curriculum);
  const [grade, setGrade] = useState<Grade>(profile.grade);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const save = async () => {
    update((s) => (s.profile ? { ...s, profile: { ...s.profile, name: name.trim(), curriculum, grade } } : s));
    if (user) {
      await supabase.from("profiles").update({ display_name: name.trim() }).eq("user_id", user.id);
    }
    setEditOpen(false);
    toast.success("Saved ✨");
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      const { error: dbErr } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, avatar_url: url, display_name: dbProfile?.display_name ?? profile.name },
          { onConflict: "user_id" },
        );
      if (dbErr) throw dbErr;
      notifyProfileChanged({
        user_id: user.id,
        display_name: dbProfile?.display_name ?? profile.name,
        avatar_url: url,
      });
      await refresh();
      toast.success("Profile picture updated 📸");
    } catch (err: unknown) {
      console.error("avatar upload failed", err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    if (!confirm("Reset all app data? This cannot be undone.")) return;
    resetAll();
    toast.success("App data reset");
    navigate({ to: "/" });
  };

  const initials = (dbProfile?.display_name || profile.name || "?")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const syncLabel =
    sync.status === "syncing" ? "Syncing…"
    : sync.status === "offline" ? "Offline"
    : sync.status === "error" ? "Sync failed"
    : sync.lastSyncedAt ? `Synced ${new Date(sync.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Up to date";

  const planLabel = info?.isPro ? "Pro" : info?.isTrial ? `Trial · ${info.daysLeft}d left` : "Expired";

  return (
    <AppShell>
      {/* ---------------- Profile header ---------------- */}
      <Card className="page-enter overflow-hidden p-0">
        <div className="bg-gradient-ocean px-5 pb-5 pt-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-card text-xl font-bold text-primary ring-2 ring-primary-foreground/40">
                {dbProfile?.avatar_url ? (
                  <img src={dbProfile.avatar_url} alt={`${dbProfile.display_name || profile.name} profile picture`} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="press absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-foreground/70 bg-card text-foreground shadow-md"
                title="Change picture"
                aria-label="Change profile picture"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
            </div>

            <div className="min-w-0 flex-1 text-primary-foreground">
              <h1 className="truncate font-display text-xl font-bold leading-tight">
                {dbProfile?.display_name || profile.name}
              </h1>
              <p className="truncate text-sm opacity-80">{user?.email}</p>
              <p className="mt-1 truncate text-xs opacity-70">
                {profile.curriculum} · {profile.grade}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- Account ---------------- */}
      <Group title="Account">
        <Row tile="blue" icon={User} label="Edit profile" value={dbProfile?.display_name || profile.name} onClick={() => { setName(profile.name); setCurriculum(profile.curriculum); setGrade(profile.grade); setEditOpen(true); }} />
        <Row tile="teal" icon={GraduationCap} label="Curriculum & grade" value={`${profile.curriculum} · ${profile.grade}`} onClick={() => setEditOpen(true)} />
        <Row
          tile="green"
          icon={sync.status === "offline" ? CloudOff : Cloud}
          label="Devices & sync"
          value={syncLabel}
          onClick={() => { void syncNow(); toast.success("Syncing your account…"); }}
        />
      </Group>

      {/* ---------------- Subscription ---------------- */}
      <Group title="Subscription">
        <Row tile="amber" icon={Crown} label="Insightly Pro" value={planLabel} to="/go-pro" />
        <Row tile="pink" icon={Heart} label="Support the creator" value="M-Pesa" to="/donate" />
      </Group>

      {/* ---------------- App ---------------- */}
      <Group title="App">
        <Row tile="violet" icon={KeyRound} label="Permissions" onClick={() => setPermsOpen(true)} />
        <Row tile="orange" icon={PlayCircle} label="Replay intro tutorial" onClick={() => setShowIntro(true)} />
        <Row tile="teal" icon={BellRing} label="Study reminders" value="In tasks" to="/tasks" />
        <Row tile="blue" icon={Sparkles} label="Ask Iris" value="AI tutor" to="/tutor" />
      </Group>

      {/* ---------------- About ---------------- */}
      <Group title="Help & legal">
        <Row tile="slate" icon={Info} label="About Insightly" value="Ezen Uel Studios" to="/about" />
        <Row tile="slate" icon={FileText} label="Terms of Service" to="/terms" />
        <Row tile="slate" icon={ShieldCheck} label="Privacy Policy" to="/privacy" />
        {isAdmin && <Row tile="red" icon={Shield} label="Admin panel" to="/admin" />}
      </Group>

      {/* ---------------- Danger ---------------- */}
      <Group>
        <Row
          tile="slate"
          icon={LogOut}
          label="Sign out"
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
            navigate({ to: "/auth" });
          }}
        />
        <Row tile="red" icon={Trash2} label="Reset app data" danger onClick={reset} />
      </Group>

      <p className="mt-6 mb-2 text-center text-xs text-muted-foreground">
        Insightly · built by Ezen Uel Studios
      </p>

      {showIntro && <IntroTutorial forceOpen onClose={() => setShowIntro(false)} />}

      {/* ---------------- Edit profile dialog ---------------- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Your learning setup shapes notes, revision and Iris answers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label>Curriculum</Label>
              <Select value={curriculum} onValueChange={(v) => setCurriculum(v as Curriculum)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRICULA.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Insightly moves you up automatically each new academic year.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} className="w-full bg-gradient-primary text-primary-foreground">
              <Check className="mr-2 h-4 w-4" /> Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Permissions dialog ---------------- */}
      <Dialog open={permsOpen} onOpenChange={setPermsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>App permissions</DialogTitle>
            <DialogDescription>Manage what Insightly can use on this device.</DialogDescription>
          </DialogHeader>
          <DevicePermissions />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

export { PanelRow, RefreshCw };
