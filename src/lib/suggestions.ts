import type { Profile, Task, RevisionDone } from "./store";
import { getQuestions } from "./revision";

export function smartSuggestion(
  profile: Profile,
  tasks: Task[],
  revisionDone: RevisionDone[],
): string {
  const lastActive = new Date(profile.lastActive).getTime();
  const daysSince = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);

  if (daysSince > 2) return "You haven't studied in 2 days 👀 — let's get back on it!";

  const overdue = tasks.filter(
    (t) => !t.completed && new Date(t.deadline).getTime() < Date.now(),
  );
  if (overdue.length > 0) return `You have ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""} — tackle one now 💪`;

  const upcoming = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];
  if (upcoming) return `Next up: "${upcoming.title}" — finish it strong ✨`;

  const questions = getQuestions(profile.curriculum, profile.grade);
  const doneIds = new Set(revisionDone.map((r) => r.questionId));
  const next = questions.find((q) => !doneIds.has(q.id));
  if (next) return `Revise ${next.subject} today — try: "${next.question}"`;

  return "All caught up! Try adding a new task or note 🌟";
}
