import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStore, calcAge, type Curriculum, type Grade } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Onboarding,
});

const CURRICULA: Curriculum[] = ["CBC", "IGCSE", "Cambridge", "British", "American", "IB"];
const GRADES: Grade[] = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}` as Grade);

function Onboarding() {
  const navigate = useNavigate();
  const { state, update } = useStore();
  const { user, loading } = useAuth();

  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [curriculum, setCurriculum] = useState<Curriculum | "">("");
  const [grade, setGrade] = useState<Grade | "">("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (state.hydrated && state.profile) navigate({ to: "/home" });
  }, [loading, user, state.hydrated, state.profile, navigate]);

  const age = dob ? calcAge(dob.toISOString()) : null;

  const handleStart = () => {
    if (!name.trim() || !dob || !curriculum || !grade) {
      toast.error("Please fill in all fields");
      return;
    }
    update((s) => ({
      ...s,
      profile: {
        name: name.trim(),
        dob: dob.toISOString(),
        curriculum,
        grade,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      },
    }));
    toast.success(`Welcome, ${name}! 🎉`);
    navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen bg-gradient-soft px-5 py-10">
      <div className="mx-auto max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow animate-scale-in">
            <img src={insightlyIcon} alt="Insightly" className="h-20 w-20" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Insightly</h1>
          <p className="mt-1 text-sm text-muted-foreground">Learn smart with Nexus, your AI companion.</p>
        </div>

        <div className="space-y-5 rounded-3xl bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" placeholder="e.g. Amani" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          </div>

          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !dob && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dob ? format(dob, "PPP") : "Pick your birthday"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dob}
                  onSelect={setDob}
                  captionLayout="dropdown"
                  fromYear={1990}
                  toYear={new Date().getFullYear()}
                  disabled={(d) => d > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {age !== null && <p className="text-xs text-muted-foreground">You are {age} years old</p>}
          </div>

          <div className="space-y-2">
            <Label>Curriculum</Label>
            <Select value={curriculum} onValueChange={(v) => setCurriculum(v as Curriculum)}>
              <SelectTrigger><SelectValue placeholder="Select curriculum" /></SelectTrigger>
              <SelectContent>
                {CURRICULA.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Grade</Label>
            <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
              <SelectTrigger><SelectValue placeholder="Select your grade" /></SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleStart} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90" size="lg">
            Start →
          </Button>
        </div>
      </div>
    </div>
  );
}
