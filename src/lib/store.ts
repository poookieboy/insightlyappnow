// Shared in-memory store backed by localStorage.
// Single source of truth — all components subscribe to one state.
// No per-listener JSON re-parsing, no event-bus ping-pong.

import { useSyncExternalStore, useCallback } from "react";

export type Curriculum = "CBC" | "IGCSE" | "Cambridge" | "British" | "American" | "IB";
export type Grade =
  | "Grade 1" | "Grade 2" | "Grade 3" | "Grade 4" | "Grade 5" | "Grade 6"
  | "Grade 7" | "Grade 8" | "Grade 9" | "Grade 10" | "Grade 11" | "Grade 12";

export interface Profile {
  name: string;
  dob: string;
  curriculum: Curriculum;
  grade: Grade;
  createdAt: string;
  lastActive: string;
  /** Academic year (calendar year) in which this grade was set — drives auto-progression. */
  gradeYear?: number;
}

export interface Task {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
  completedAt?: string;
  onTime?: boolean;
}

export interface TimetableEntry {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  time: string;
  subject: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  imageDataUrl?: string;
  createdAt: string;
  type: "note" | "diagram" | "slide";
}

export interface RevisionDone {
  questionId: string;
  doneAt: string;
}

export interface BadgeState {
  unlocked: string[];
}

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
  /** Optional image attachments (data URLs) sent with a user message. */
  images?: string[];
}

export interface TutorConversation {
  id: string;
  title: string;
  projectId: string | null;
  subject?: string;
  messages: TutorMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TutorProject {
  id: string;
  name: string;
  instructions?: string;
  createdAt: string;
}

export interface ExamResult {
  id: string;
  date: string;
  label: string;
  subjects: { subject: string; score: number; outOf: number }[];
  feedback?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetPercent: number;
  subject?: string;
  deadline?: string;
  createdAt: string;
  done?: boolean;
}

export interface StreakSettings {
  /** Hour of day (0-23) at which a new "study day" begins. Default 4 = 4 AM,
   *  so activity at 1 AM still counts toward the previous calendar day. */
  dayStartHour: number;
  /** Number of missed days the streak tolerates before resetting. Default 1. */
  graceDays: number;
}

export interface AppState {
  profile: Profile | null;
  tasks: Task[];
  timetable: TimetableEntry[];
  notes: Note[];
  revisionDone: RevisionDone[];
  badges: BadgeState;
  tutorConversations: TutorConversation[];
  tutorProjects: TutorProject[];
  generatedPapers: import("./papers").Paper[];
  examResults: ExamResult[];
  goals: Goal[];
  streakSettings: StreakSettings;
  /** Monotonic local revision (ms) — bumped on every local write. Used for sync. */
  rev: number;
  hydrated: boolean;
}

const KEY = "studentsync:v1";

export const defaultStreakSettings: StreakSettings = {
  dayStartHour: 4,
  graceDays: 1,
};

const defaultState: AppState = {
  profile: null,
  tasks: [],
  timetable: [],
  notes: [],
  revisionDone: [],
  badges: { unlocked: [] },
  tutorConversations: [],
  tutorProjects: [],
  generatedPapers: [],
  examResults: [],
  goals: [],
  streakSettings: defaultStreakSettings,
  rev: 0,
  hydrated: false,
};

// Module-level singleton state
let memoryState: AppState = defaultState;
const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  listeners.forEach((l) => l());
}

function loadFromStorage(): AppState {
  if (typeof window === "undefined") return { ...defaultState, hydrated: true };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultState, hydrated: true };
    return { ...defaultState, ...JSON.parse(raw), hydrated: true };
  } catch {
    return { ...defaultState, hydrated: true };
  }
}

function persist(state: AppState) {
  if (typeof window === "undefined") return;
  // Strip hydrated flag from persisted payload
  const { hydrated: _h, ...rest } = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* ignore quota errors */
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  memoryState = loadFromStorage();
  // Cross-tab sync (only refresh on actual storage event from other tabs)
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    memoryState = loadFromStorage();
    emit();
  });
}

function subscribe(listener: () => void) {
  ensureInit();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureInit();
  return memoryState;
}

function getServerSnapshot() {
  return defaultState;
}

export function useStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback(commit, []);

  return { state, update };
}

/** Apply a local mutation. Bumps the revision counter so cloud sync can order writes. */
export function commit(updater: (s: AppState) => AppState) {
  const next = updater(memoryState);
  if (next === memoryState) return;
  memoryState = { ...next, rev: Date.now() };
  persist(memoryState);
  emit();
}

/** Read the current state outside React (sync engine). */
export function getState(): AppState {
  ensureInit();
  return memoryState;
}

/** Replace state from a remote/merged snapshot without bumping the local revision. */
export function replaceState(next: AppState) {
  memoryState = { ...next, hydrated: true };
  persist(memoryState);
  emit();
}

/** Subscribe to store changes outside React. */
export function subscribeStore(listener: () => void) {
  return subscribe(listener);
}

export function resetAll() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  memoryState = { ...defaultState, rev: Date.now(), hydrated: true };
  emit();
}

export function calcAge(dob: string): number {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
