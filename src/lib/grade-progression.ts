import type { Profile, Grade } from "./store";

/**
 * Academic-calendar configuration.
 * Kenya's CBC academic year runs January -> November, so a new academic year
 * starts in January. Curricula that start mid-year can simply change
 * `academicYearStartMonth` (1-12) without touching the progression logic.
 */
export const ACADEMIC_CALENDAR = {
  academicYearStartMonth: 1,
  maxGrade: 12,
  minGrade: 1,
};

export function gradeNumber(grade: Grade | string): number {
  const n = parseInt(String(grade).replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : 1;
}

export function gradeFromNumber(n: number): Grade {
  const clamped = Math.min(ACADEMIC_CALENDAR.maxGrade, Math.max(ACADEMIC_CALENDAR.minGrade, n));
  return `Grade ${clamped}` as Grade;
}

/** The academic year a date belongs to. */
export function academicYearOf(date: Date | string = new Date()): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  return d.getMonth() + 1 >= ACADEMIC_CALENDAR.academicYearStartMonth ? year : year - 1;
}

export interface ProgressionResult {
  profile: Profile;
  advancedBy: number;
  newGrade: Grade;
}

/**
 * Returns an updated profile if the learner should move up one or more grades,
 * otherwise `null`. Idempotent — safe to call on every app load.
 */
export function applyGradeProgression(profile: Profile, now: Date = new Date()): ProgressionResult | null {
  const currentYear = academicYearOf(now);
  const baseline = profile.gradeYear ?? academicYearOf(profile.createdAt || now.toISOString());

  if (profile.gradeYear == null) {
    // First run: record the baseline without moving the learner.
    return { profile: { ...profile, gradeYear: baseline }, advancedBy: 0, newGrade: profile.grade };
  }

  const years = currentYear - baseline;
  if (years <= 0) return null;

  const current = gradeNumber(profile.grade);
  const target = Math.min(ACADEMIC_CALENDAR.maxGrade, current + years);
  const newGrade = gradeFromNumber(target);
  const advancedBy = target - current;

  if (advancedBy <= 0) {
    return { profile: { ...profile, gradeYear: currentYear }, advancedBy: 0, newGrade: profile.grade };
  }

  return {
    profile: { ...profile, grade: newGrade, gradeYear: currentYear },
    advancedBy,
    newGrade,
  };
}
