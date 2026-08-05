import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  BookOpen,
  Trophy,
  Mic,
  NotebookPen,
  CloudDownload,
  ShieldCheck,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import insightlyIcon from "@/assets/insightly-icon.png";
import irisAvatar from "@/assets/iris-avatar.png";

const KEY = "insightly:intro:v1";

const ICON = "h-20 w-20";
const slides = [
  {
    icon: <img src={insightlyIcon} alt="Insightly" className={cn(ICON, "object-contain")} />,
    title: "Welcome to Insightly",
    body: "Your all-in-one study companion — notes, tasks, revision, quizzes, exam tracking, and more.",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    icon: <NotebookPen className={cn(ICON, "text-white")} strokeWidth={1.5} />,
    title: "Smart Notes",
    body: "Rich text, drawings, images and voice notes — organised into colourful categories you control.",
    accent: "from-sky-500 to-blue-600",
  },
  {
    icon: <BookOpen className={cn(ICON, "text-white")} strokeWidth={1.5} />,
    title: "Revision that fits your syllabus",
    body: "Practice curriculum-matched questions for your grade, answer in your own words, and get instant marking.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: <ListChecks className={cn(ICON, "text-white")} strokeWidth={1.5} />,
    title: "Tasks & timetable",
    body: "Plan your week, track deadlines in a clean month view, and never miss an assignment again.",
    accent: "from-lime-500 to-emerald-600",
  },
  {
    icon: <CloudDownload className={cn(ICON, "text-white")} strokeWidth={1.5} />,
    title: "Offline learning",
    body: "Notes, timetable and saved revision keep working without data. Everything syncs when you're back online.",
    accent: "from-cyan-500 to-sky-600",
  },
  {
    icon: <LayoutGrid className={cn(ICON, "text-white")} strokeWidth={1.5} />,
    title: "Exam analysis & progress",
    body: "Log results into folders like CAT, Midterm and End Term, then watch streaks, badges and charts track your growth.",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    icon: <img src={irisAvatar} alt="Iris" className={cn(ICON, "object-contain")} />,
    title: "Meet Iris, your AI tutor",
    body: "Ask anything, snap a photo of your homework, or tap the mic and talk it through — Iris even reads answers back aloud.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: <ShieldCheck className={cn(ICON, "text-white")} strokeWidth={1.5} />,
    title: "Secure cloud sync",
    body: "Your work is encrypted in transit and backed up to your private account — only you can see it.",
    accent: "from-slate-600 to-slate-900",
  },
  {
    icon: <Trophy className={cn(ICON, "text-white")} strokeWidth={1.5} />,
    title: "Let's get started",
    body: "Sign in or create a free account and begin your 7-day trial — no card needed.",
    accent: "from-amber-500 to-rose-500",
  },
];

export function IntroTutorial({
  forceOpen,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setI(0);
      return;
    }
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, [forceOpen]);

  const finish = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
    onClose?.();
  };

  const slide = slides[i];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) finish();
      }}
    >
      <DialogContent className="max-w-md overflow-hidden p-0 border-0">
        <div
          className={cn(
            "relative overflow-hidden bg-gradient-to-br p-10 text-center transition-colors duration-500",
            slide.accent,
          )}
        >
          <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div
            className="relative mx-auto flex animate-scale-in items-center justify-center"
            key={i}
          >
            <div className="animate-badge-float">{slide.icon}</div>
          </div>
          <div className="relative mt-6 h-1 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${((i + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="space-y-4 p-6 animate-fade-in" key={`t-${i}`}>
          <div className="flex items-center justify-center gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === i ? "w-6 bg-primary" : "w-1.5 bg-muted",
                )}
              />
            ))}
          </div>
          <h2 className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {slide.title}
          </h2>
          <p className="text-center text-sm text-muted-foreground">{slide.body}</p>
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setI((v) => Math.max(0, v - 1))}
              disabled={i === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {i < slides.length - 1 ? (
              <>
                <Button variant="ghost" size="sm" onClick={finish}>
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={() => setI((v) => v + 1)}
                  className="bg-gradient-primary text-primary-foreground"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={finish}
                className="bg-gradient-primary text-primary-foreground"
              >
                Let's get started ✨
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
