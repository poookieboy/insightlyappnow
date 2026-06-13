import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useEffect } from "react";
import { Heart, ChevronRight, LogOut, Camera, Loader2, Flame, BarChart3, PlayCircle, Crown, Shield, Info, FileText, ShieldCheck, Sparkles } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import { StudyAnalytics } from "@/components/StudyAnalytics";
import { IntroTutorial } from "@/components/IntroTutorial";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore, resetAll, defaultStreakSettings, type Curriculum, type Grade } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, notifyProfileChanged } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
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

      {subInfo && (
        <Card
          className={`mb-4 overflow-hidden p-0 ${
            subInfo.isPro
              ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-400/5 to-orange-500/10"
              : subInfo.isActive
              ? "border-primary/30 bg-gradient-to-br from-primary/8 to-primary/3"
              : "border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-600/5"
          }`}
        >
          <div className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  subInfo.isPro
                    ? "bg-amber-500/20 text-amber-600"
                    : subInfo.isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-red-500/15 text-red-600"
                }`}
              >
                {subInfo.isPro ? <Crown className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">
                    {subInfo.isPro ? "Insightly Pro" : subInfo.isActive ? "Free Trial" : "Trial Expired"}
                  </h2>
                  <Badge
                    variant="secondary"
                    className={
                      subInfo.isPro
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        : subInfo.isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-red-500/15 text-red-700"
                    }
                  >
                    {subInfo.isPro ? "ACTIVE" : subInfo.isActive ? "TRIAL" : "LOCKED"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {subInfo.isPro
                    ? `Renews ${subInfo.expiresAt.toLocaleDateString()}`
                    : subInfo.isActive
                    ? `${subInfo.daysLeft} day${subInfo.daysLeft === 1 ? "" : "s"} left · ends ${subInfo.expiresAt.toLocaleDateString()}`
                    : `Ended ${subInfo.expiresAt.toLocaleDateString()}`}
                </p>
              </div>
            </div>
            {!subInfo.isPro && (
              <Link to="/go-pro">
                <Button className="w-full bg-gradient-primary text-primary-foreground">
                  <Crown className="h-4 w-4 mr-2" />
                  {subInfo.isActive ? "Upgrade to Pro" : "Reactivate — Upgrade now"}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}


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

      <Card className="mt-4 space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="font-semibold">Streak rules</h2>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Studying past midnight? Set a custom day-start so late-night sessions still count toward yesterday.
        </p>

        <div className="space-y-2">
          <Label>Day starts at</Label>
          <Select
            value={String(state.streakSettings?.dayStartHour ?? defaultStreakSettings.dayStartHour)}
            onValueChange={(v) =>
              update((s) => ({
                ...s,
                streakSettings: { ...(s.streakSettings ?? defaultStreakSettings), dayStartHour: Number(v) },
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {h === 0 ? "Midnight (12 AM)" : `${h} AM`}{h === 4 ? " — recommended" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            E.g. with 4 AM, a study session at 1 AM still counts as the previous day.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Grace days (skip allowance)</Label>
          <Select
            value={String(state.streakSettings?.graceDays ?? defaultStreakSettings.graceDays)}
            onValueChange={(v) =>
              update((s) => ({
                ...s,
                streakSettings: { ...(s.streakSettings ?? defaultStreakSettings), graceDays: Number(v) },
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 — strict, no missed days</SelectItem>
              <SelectItem value="1">1 — miss a day, stay on streak</SelectItem>
              <SelectItem value="2">2 — chill mode</SelectItem>
              <SelectItem value="3">3 — relaxed</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Your streak survives this many missed days in a row before resetting.
          </p>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Study analytics</h2>
        </div>
        <p className="-mt-1 mb-4 text-xs text-muted-foreground">
          A detailed look at your study habits, subjects, and performance.
        </p>
        <StudyAnalytics />
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

      {!subInfo?.isPro && (
        <Link to="/go-pro" className="block">
          <Card className="mt-4 flex items-center gap-3 border-primary/30 bg-gradient-primary p-4 text-primary-foreground shadow-glow transition-all active:scale-[0.98]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Upgrade to Insightly Pro</p>
              <p className="text-xs opacity-90">KES 150/mo or KES 1,500/yr</p>
            </div>
            <ChevronRight className="h-4 w-4 opacity-80" />
          </Card>
        </Link>
      )}

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
            <p className="text-xs text-muted-foreground">Built by Ezenuel Studios</p>
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
