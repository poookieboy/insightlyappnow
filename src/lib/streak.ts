import type { Task, RevisionDone } from "./store";

function dayKey(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Count consecutive days (ending today or yesterday) with any activity. */
export function computeStreak(tasks: Task[], revisionDone: RevisionDone[]): number {
  const days = new Set<string>();
  tasks.forEach((t) => t.completedAt && days.add(dayKey(t.completedAt)));
  revisionDone.forEach((r) => days.add(dayKey(r.doneAt)));
  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  // Allow streak to start today OR yesterday (so it doesn't reset before bedtime)
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
