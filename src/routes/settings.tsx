import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Heart, ChevronRight, LogOut, Camera, Loader2 } from "lucide-react";
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
import { useProfile } from "@/hooks/useProfile";
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

  const [name, setName] = useState(profile.name);
  const [curriculum, setCurriculum] = useState<Curriculum>(profile.curriculum);
  const [grade, setGrade] = useState<Grade>(profile.grade);

  const save = () => {
    update((s) => (s.profile ? { ...s, profile: { ...s.profile, name: name.trim(), curriculum, grade } } : s));
    toast.success("Saved ✨");
  };

  const reset = () => {
    if (!confirm("Reset all app data? This cannot be undone.")) return;
    resetAll();
    toast.success("App data reset");
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Settings</h1>
      <p className="mb-5 text-sm text-muted-foreground">Update your profile or reset data.</p>

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

      <Link to="/donate" className="block">
        <Card className="mt-4 flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Support the creator</p>
            <p className="text-xs text-muted-foreground">Buy a coffee, PayPal, or M-Pesa</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>

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
