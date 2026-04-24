import { toast } from "sonner";
import type { Task, RevisionDone, BadgeState } from "./store";

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  check: (ctx: { tasks: Task[]; revisionDone: RevisionDone[] }) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-task",
    name: "First Task Completed",
    emoji: "🎯",
    description: "Complete your very first task",
    check: ({ tasks }) => tasks.some((t) => t.completed),
  },
  {
    id: "three-tasks",
    name: "Triple Threat",
    emoji: "🔥",
    description: "Complete 3 tasks",
    check: ({ tasks }) => tasks.filter((t) => t.completed).length >= 3,
  },
  {
    id: "ten-tasks",
    name: "Task Master",
    emoji: "🏆",
    description: "Complete 10 tasks",
    check: ({ tasks }) => tasks.filter((t) => t.completed).length >= 10,
  },
  {
    id: "first-revision",
    name: "First Revision Done",
    emoji: "📚",
    description: "Complete your first revision question",
    check: ({ revisionDone }) => revisionDone.length >= 1,
  },
  {
    id: "five-revisions",
    name: "Study Streak",
    emoji: "⚡",
    description: "Complete 5 revision questions",
    check: ({ revisionDone }) => revisionDone.length >= 5,
  },
  {
    id: "on-time",
    name: "On-Time Submission",
    emoji: "⏰",
    description: "Complete a task before its deadline",
    check: ({ tasks }) => tasks.some((t) => t.completed && t.onTime === true),
  },
];

export function evaluateBadges(
  current: BadgeState,
  ctx: { tasks: Task[]; revisionDone: RevisionDone[] },
): { next: BadgeState; newly: BadgeDef[] } {
  const newly: BadgeDef[] = [];
  const unlocked = new Set(current.unlocked);
  for (const b of BADGES) {
    if (!unlocked.has(b.id) && b.check(ctx)) {
      unlocked.add(b.id);
      newly.push(b);
    }
  }
  return { next: { unlocked: Array.from(unlocked) }, newly };
}

export function notifyBadges(newly: BadgeDef[]) {
  newly.forEach((b) => {
    toast.success(`🏅 Badge Unlocked!`, {
      description: `${b.emoji} ${b.name}`,
    });
  });
}
