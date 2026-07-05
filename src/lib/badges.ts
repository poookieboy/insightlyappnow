import { toast } from "sonner";
import type {
  Task,
  RevisionDone,
  BadgeState,
  Note,
  ExamResult,
  Goal,
  TutorConversation,
} from "./store";
import { computeStreak } from "./streak";

export type BadgeCategory = "achievement" | "monthly";

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  /** 1-12 for monthly badges */
  month?: number;
  /** Character palette + prop key consumed by <BadgeCharacter /> */
  palette: [string, string];
  prop: string;
  check: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  tasks: Task[];
  revisionDone: RevisionDone[];
  notes?: Note[];
  examResults?: ExamResult[];
  goals?: Goal[];
  tutorConversations?: TutorConversation[];
}

const hourOf = (iso?: string) => (iso ? new Date(iso).getHours() : -1);

/** Does the user have activity in the given calendar month/year? */
function hasActivityIn(ctx: BadgeContext, month: number, year: number): boolean {
  const inMonth = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getMonth() === month && d.getFullYear() === year;
  };
  if (ctx.tasks.some((t) => t.completed && inMonth(t.completedAt))) return true;
  if (ctx.revisionDone.some((r) => inMonth(r.doneAt))) return true;
  if (ctx.notes?.some((n) => inMonth(n.createdAt))) return true;
  return false;
}

/** Monthly badge factory — only unlocks during that month, with activity that month. */
function monthly(
  id: string,
  month: number,
  name: string,
  description: string,
  palette: [string, string],
  prop: string,
): BadgeDef {
  return {
    id,
    name,
    description,
    category: "monthly",
    month,
    palette,
    prop,
    check: (ctx) => {
      const now = new Date();
      if (now.getMonth() !== month - 1) return false;
      return hasActivityIn(ctx, month - 1, now.getFullYear());
    },
  };
}

export const ACHIEVEMENT_BADGES: BadgeDef[] = [
  {
    id: "first-task",
    name: "First Task",
    description: "Complete your very first task",
    category: "achievement",
    palette: ["#60a5fa", "#2563eb"],
    prop: "check",
    check: ({ tasks }) => tasks.some((t) => t.completed),
  },
  {
    id: "three-tasks",
    name: "Triple Threat",
    description: "Complete 3 tasks",
    category: "achievement",
    palette: ["#fb7185", "#e11d48"],
    prop: "triple",
    check: ({ tasks }) => tasks.filter((t) => t.completed).length >= 3,
  },
  {
    id: "ten-tasks",
    name: "Task Master",
    description: "Complete 10 tasks",
    category: "achievement",
    palette: ["#f59e0b", "#b45309"],
    prop: "trophy",
    check: ({ tasks }) => tasks.filter((t) => t.completed).length >= 10,
  },
  {
    id: "first-revision",
    name: "First Revision",
    description: "Complete your first revision question",
    category: "achievement",
    palette: ["#a78bfa", "#6d28d9"],
    prop: "book",
    check: ({ revisionDone }) => revisionDone.length >= 1,
  },
  {
    id: "five-revisions",
    name: "Study Streak",
    description: "Complete 5 revision questions",
    category: "achievement",
    palette: ["#22d3ee", "#0e7490"],
    prop: "bolt",
    check: ({ revisionDone }) => revisionDone.length >= 5,
  },
  {
    id: "on-time",
    name: "On-Time",
    description: "Complete a task before its deadline",
    category: "achievement",
    palette: ["#34d399", "#047857"],
    prop: "clock",
    check: ({ tasks }) => tasks.some((t) => t.completed && t.onTime === true),
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Complete a task before 8 AM",
    category: "achievement",
    palette: ["#fde68a", "#f59e0b"],
    prop: "sun",
    check: ({ tasks }) =>
      tasks.some((t) => {
        if (!t.completed || !t.completedAt) return false;
        const h = hourOf(t.completedAt);
        return h >= 0 && h < 8;
      }),
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Study after 9 PM",
    category: "achievement",
    palette: ["#818cf8", "#312e81"],
    prop: "moon",
    check: ({ tasks, revisionDone }) => {
      if (tasks.some((t) => t.completed && hourOf(t.completedAt) >= 21)) return true;
      return revisionDone.some((r) => hourOf(r.doneAt) >= 21);
    },
  },
  {
    id: "comeback-kid",
    name: "Comeback Kid",
    description: "Improved a score by 20%+ after a retest",
    category: "achievement",
    palette: ["#f472b6", "#be185d"],
    prop: "rocket",
    check: ({ examResults }) => {
      if (!examResults || examResults.length < 2) return false;
      const bySubject = new Map<string, { pct: number; date: string }[]>();
      for (const r of examResults) {
        for (const s of r.subjects) {
          if (!s.outOf) continue;
          const pct = (s.score / s.outOf) * 100;
          const arr = bySubject.get(s.subject) ?? [];
          arr.push({ pct, date: r.date });
          bySubject.set(s.subject, arr);
        }
      }
      for (const arr of bySubject.values()) {
        arr.sort((a, b) => a.date.localeCompare(b.date));
        for (let i = 1; i < arr.length; i++) {
          if (arr[i].pct - arr[i - 1].pct >= 20) return true;
        }
      }
      return false;
    },
  },
  {
    id: "perfect-score",
    name: "Perfect Score",
    description: "Scored 100% on an exam",
    category: "achievement",
    palette: ["#fcd34d", "#d97706"],
    prop: "star",
    check: ({ examResults }) =>
      !!examResults?.some((r) => r.subjects.some((s) => s.outOf > 0 && s.score >= s.outOf)),
  },
  {
    id: "iris-favorite",
    name: "Iris's Favorite",
    description: "Sent 50+ messages to Iris",
    category: "achievement",
    palette: ["#c084fc", "#7e22ce"],
    prop: "heart",
    check: ({ tutorConversations }) => {
      if (!tutorConversations) return false;
      const count = tutorConversations.reduce(
        (n, c) => n + c.messages.filter((m) => m.role === "user").length,
        0,
      );
      return count >= 50;
    },
  },
  {
    id: "note-taker",
    name: "Note Taker",
    description: "Created 10+ notes",
    category: "achievement",
    palette: ["#facc15", "#a16207"],
    prop: "note",
    check: ({ notes }) => (notes?.length ?? 0) >= 10,
  },
  {
    id: "consistency-monarch",
    name: "Consistency King/Queen",
    description: "Achieve a 7-day streak",
    category: "achievement",
    palette: ["#fb923c", "#c2410c"],
    prop: "crown",
    check: (ctx) => computeStreak(ctx.tasks, ctx.revisionDone) >= 7,
  },
  {
    id: "marathon-learner",
    name: "Marathon Learner",
    description: "Achieve a 30-day streak",
    category: "achievement",
    palette: ["#ef4444", "#7f1d1d"],
    prop: "medal",
    check: (ctx) => computeStreak(ctx.tasks, ctx.revisionDone) >= 30,
  },
  {
    id: "all-rounder",
    name: "All-Rounder",
    description: "Log results in 5+ different subjects",
    category: "achievement",
    palette: ["#2dd4bf", "#0f766e"],
    prop: "globe",
    check: ({ examResults }) => {
      if (!examResults) return false;
      const subjects = new Set<string>();
      examResults.forEach((r) => r.subjects.forEach((s) => subjects.add(s.subject.toLowerCase())));
      return subjects.size >= 5;
    },
  },
  {
    id: "goal-getter",
    name: "Goal Getter",
    description: "Complete a goal in Exam Analysis",
    category: "achievement",
    palette: ["#4ade80", "#166534"],
    prop: "target",
    check: ({ goals }) => !!goals?.some((g) => g.done),
  },
];

const MONTH_META: Array<{
  m: number;
  id: string;
  name: string;
  desc: string;
  palette: [string, string];
  prop: string;
}> = [
  { m: 1,  id: "jan-fresh-start",     name: "Fresh Start",       desc: "Study in January",   palette: ["#e0f2fe", "#0284c7"], prop: "snowflake" },
  { m: 2,  id: "feb-sharp-mind",      name: "Sharp Mind",        desc: "Study in February",  palette: ["#fbcfe8", "#db2777"], prop: "bolt" },
  { m: 3,  id: "mar-spring-sprint",   name: "Spring Sprint",     desc: "Study in March",     palette: ["#bbf7d0", "#16a34a"], prop: "leaf" },
  { m: 4,  id: "apr-rainy-revision",  name: "Rainy Day Revision", desc: "Study in April",    palette: ["#bae6fd", "#0369a1"], prop: "umbrella" },
  { m: 5,  id: "may-halfway-hero",    name: "Halfway Hero",      desc: "Study in May",       palette: ["#fde68a", "#ca8a04"], prop: "shield" },
  { m: 6,  id: "jun-exam-warrior",    name: "Exam Warrior",      desc: "Study in June",      palette: ["#fecaca", "#b91c1c"], prop: "sword" },
  { m: 7,  id: "jul-summer-scholar",  name: "Summer Scholar",    desc: "Study in July",      palette: ["#fef08a", "#ea580c"], prop: "sun" },
  { m: 8,  id: "aug-comeback-season", name: "Comeback Season",   desc: "Study in August",    palette: ["#fed7aa", "#c2410c"], prop: "rocket" },
  { m: 9,  id: "sep-new-term",        name: "New Term, New Me",  desc: "Study in September", palette: ["#c7d2fe", "#4338ca"], prop: "backpack" },
  { m: 10, id: "oct-midterm-master",  name: "Midterm Master",    desc: "Study in October",   palette: ["#fdba74", "#9a3412"], prop: "pumpkin" },
  { m: 11, id: "nov-grind-mode",      name: "Grind Mode",        desc: "Study in November",  palette: ["#a3a3a3", "#404040"], prop: "gear" },
  { m: 12, id: "dec-finish-strong",   name: "Finish Strong",     desc: "Study in December",  palette: ["#fca5a5", "#166534"], prop: "gift" },
];

export const MONTHLY_BADGES: BadgeDef[] = MONTH_META.map((mm) =>
  monthly(mm.id, mm.m, mm.name, mm.desc, mm.palette, mm.prop),
);

export const BADGES: BadgeDef[] = [...ACHIEVEMENT_BADGES, ...MONTHLY_BADGES];

export function evaluateBadges(
  current: BadgeState,
  ctx: BadgeContext,
): { next: BadgeState; newly: BadgeDef[] } {
  const newly: BadgeDef[] = [];
  const unlocked = new Set(current.unlocked);
  for (const b of BADGES) {
    if (unlocked.has(b.id)) continue;
    try {
      if (b.check(ctx)) {
        unlocked.add(b.id);
        newly.push(b);
      }
    } catch {
      /* ignore individual badge failures */
    }
  }
  return { next: { unlocked: Array.from(unlocked) }, newly };
}

export function notifyBadges(newly: BadgeDef[]) {
  newly.forEach((b) => {
    toast.success("🏅 Badge Unlocked!", { description: b.name });
  });
}
