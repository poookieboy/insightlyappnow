import type { Task, RevisionDone, StreakSettings } from "./store";
import { defaultStreakSettings } from "./store";

/** Returns the "study day" key for a given moment, shifted by dayStartHour.
 *  e.g. with dayStartHour=4, anything from 04:00 today until 03:59 tomorrow
 *  belongs to today. So a study session at 1 AM still counts as yesterday. */
function studyDayKey(d: Date | string, dayStartHour: number): string {
  const date = typeof d === "string" ? new Date(d) : new Date(d);
  // Subtract dayStartHour hours, then take the calendar date.
  date.setHours(date.getHours() - dayStartHour);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Compute consecutive "study days" with activity, honouring:
 *   - dayStartHour: late-night work counts as the prior day
 *   - graceDays: streak survives N missed days in a row before resetting */
export function computeStreak(
  tasks: Task[],
  revisionDone: RevisionDone[],
  settings: StreakSettings = defaultStreakSettings,
): number {
  const dayStartHour = clampHour(settings.dayStartHour);
  const graceDays = Math.max(0, Math.floor(settings.graceDays ?? 0));

  const days = new Set<string>();
  tasks.forEach((t) => t.completedAt && days.add(studyDayKey(t.completedAt, dayStartHour)));
  revisionDone.forEach((r) => days.add(studyDayKey(r.doneAt, dayStartHour)));
  if (days.size === 0) return 0;

  // Walk back from today's study day. Each gap day costs 1 grace allowance.
  const cursor = shiftedDate(new Date(), dayStartHour);
  let streak = 0;
  let graceLeft = graceDays;
  let hadAny = false;

  // Limit walk to a sane horizon (e.g. 5 years).
  for (let i = 0; i < 365 * 5; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (days.has(key)) {
      streak += 1;
      hadAny = true;
    } else {
      if (!hadAny) {
        // Haven't found any activity yet — allow grace at the head too,
        // so missing today (but having yesterday) keeps the streak alive.
        if (graceLeft <= 0) return 0;
        graceLeft -= 1;
      } else {
        if (graceLeft <= 0) break;
        graceLeft -= 1;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function shiftedDate(d: Date, dayStartHour: number): Date {
  const out = new Date(d);
  out.setHours(out.getHours() - dayStartHour);
  // Normalize to midnight of that shifted day for stable key arithmetic.
  out.setHours(0, 0, 0, 0);
  return out;
}

function clampHour(h: number): number {
  if (!Number.isFinite(h)) return 4;
  return Math.min(23, Math.max(0, Math.floor(h)));
}
