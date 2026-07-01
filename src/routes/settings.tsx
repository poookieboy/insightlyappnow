import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useEffect } from "react";
import { Heart, ChevronRight, LogOut, Camera, Loader2, PlayCircle, Shield, Info, FileText, ShieldCheck, KeyRound } from "lucide-react";
import { DevicePermissions } from "@/components/DevicePermissions";
import insightlyIcon from "@/assets/insightly-icon.png";
import { IntroTutorial } from "@/components/IntroTutorial";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore, resetAll, type Curriculum, type Grade } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, notifyProfileChanged } from "@/hooks/useProfile";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: () => (
    <RequireProfile>
      <Settings />
    </RequireProfile>
  ),
});

const CURRICULA: Curriculum[] = ["CBC", "IGCSE", "Cambridge", "British", "American", "IB"];
const GRADES: Grade[] = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}` as Grade);

function Settings() {
  const { state, update } = useStore();
  const navigate = useNavigate();
  const profile = state.profile!;
  const { user } = useAuth();
  const { profile: dbProfile, refresh } = useProfile();
  const { info: subInfo } = useSubscription();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [name, setName] = useState(profile.name);
  const [curriculum, setCurriculum] = useState<Curriculum>(profile.curriculum);
  const [grade, setGrade] = useState<Grade>(profile.grade);
  const [showIntro, setShowIntro] = useState(false);

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
      // Cache-bust so every <img> reloads even if it was already showing a stale URL
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      // Use upsert in case the profiles row is somehow missing (e.g. older accounts)
      const { error: dbErr } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, avatar_url: url, display_name: dbProfile?.display_name ?? profile.name },
          { onConflict: "user_id" },
        );
      if (dbErr) throw dbErr;
      // Broadcast instantly so Home / TabBar / any mounted useProfile() updates without remount
      notifyProfileChanged({
        user_id: user.id,
        display_name: dbProfile?.display_name ?? profile.name,
        avatar_url: url,
      });
      await refresh();
      toast.success("Profile picture updated 📸");
    } catch (err: any) {
      console.error("avatar upload failed", err);
      toast.error(err?.message || "Upload failed");
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

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <img src={insightlyIcon} alt="" className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">Update your profile or reset data.</p>
        </div>
      </div>

      <Card className="mb-4 flex items-center gap-4 p-5">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-lg font-bold text-primary-foreground shadow-glow">
            {dbProfile?.avatar_url ? (
              <img src={dbProfile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-card text-foreground shadow-md hover:shadow-glow"
            title="Change picture"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{dbProfile?.display_name || profile.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
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
        </div>
        <Button onClick={save} className="w-full bg-gradient-primary text-primary-foreground">Save changes</Button>
      </Card>


      <Card className="mt-4 p-5">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">App permissions</h2>
        </div>
        <p className="-mt-1 mb-3 text-xs text-muted-foreground">
          Manage what Insightly can use on this device.
        </p>
        <DevicePermissions />
      </Card>

      <Card className="mt-4 flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
          <PlayCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Replay intro tutorial</p>
          <p className="text-xs text-muted-foreground">Take the welcome walkthrough again</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowIntro(true)}>
          Watch
        </Button>
      </Card>
      {showIntro && <IntroTutorial forceOpen onClose={() => setShowIntro(false)} />}


      <Link to="/donate" className="block">
        <Card className="mt-4 flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Support the creator</p>
            <p className="text-xs text-muted-foreground">Donate via M-Pesa Pochi la Biashara</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>

      {isAdmin && (
        <Link to="/admin" className="block">
          <Card className="mt-4 flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Admin panel</p>
              <p className="text-xs text-muted-foreground">Review subscriptions & donations</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Card>
        </Link>
      )}

      <Link to="/about" className="block">
        <Card className="mt-4 flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Info className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">About Insightly</p>
            <p className="text-xs text-muted-foreground">Built by Ezen Uel Studios</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>

      <Card className="mt-4 grid grid-cols-2 gap-2 p-2">
        <Link to="/terms" className="flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground">
          <FileText className="h-4 w-4" /> Terms
        </Link>
        <Link to="/privacy" className="flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground">
          <ShieldCheck className="h-4 w-4" /> Privacy
        </Link>
      </Card>


      <Card className="mt-4 p-5">
        <h2 className="font-semibold">Account</h2>
        <Button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
            navigate({ to: "/auth" });
          }}
          variant="outline"
          className="mt-3 w-full"
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-semibold">Danger zone</h2>
        <p className="mt-1 text-xs text-muted-foreground">This wipes all tasks, notes, timetable, badges and profile.</p>
        <Button onClick={reset} variant="destructive" className="mt-3 w-full">Reset app data</Button>
      </Card>
    </AppShell>
  );
}
