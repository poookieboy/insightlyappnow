import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, LayoutGrid, BookOpen, Trophy, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import insightlyIcon from "@/assets/insightly-icon.png";
import irisAvatar from "@/assets/iris-avatar.png";

const KEY = "insightly:intro:v1";

const slides = [
  {
    icon: <img src={insightlyIcon} alt="Insightly" className="h-24 w-24" />,
    title: "Welcome to Insightly",
    body: "Your all-in-one study companion — notes, tasks, revision, mock papers, exam tracking, and more.",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    icon: <img src={irisAvatar} alt="Iris" className="h-28 w-28" />,
    title: "Meet Iris",
    body: "Your personal AI tutor. Ask questions, get step-by-step explanations, take quizzes, or chat by voice.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: <LayoutGrid className="h-16 w-16 text-primary" />,
    title: "Dashboard at a glance",
    body: "Track your streak, badges, timetable, and AI-generated content all from one beautiful dashboard.",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    icon: <BookOpen className="h-16 w-16 text-primary" />,
    title: "Smart revision & papers",
    body: "Practice with curriculum-matched questions and AI-generated mock papers tailored to your grade.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: <Mic className="h-16 w-16 text-primary" />,
    title: "Talk to Iris",
    body: "Tap the mic in the tutor to speak your question — Iris will read the answer back to you.",
    accent: "from-orange-500 to-pink-500",
  },
  {
    icon: <Trophy className="h-16 w-16 text-warning" />,
    title: "Earn badges, build streaks",
    body: "Stay consistent. Unlock achievements as you study, and watch your progress in beautiful charts.",
    accent: "from-amber-500 to-rose-500",
  },
];

export function IntroTutorial({ forceOpen, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="max-w-md overflow-hidden p-0 border-0">
        <div className={cn("relative bg-gradient-to-br p-10 text-center transition-colors duration-500", slide.accent)}>
          <div className="mx-auto flex items-center justify-center animate-scale-in" key={i}>
            {slide.icon}
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
                <Button variant="ghost" size="sm" onClick={finish}>Skip</Button>
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
                Get started ✨
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
