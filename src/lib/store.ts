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

interface AppState {
  profile: Profile | null;
  tasks: Task[];
  timetable: TimetableEntry[];
  notes: Note[];
  revisionDone: RevisionDone[];
  badges: BadgeState;
  hydrated: boolean;
}

const KEY = "studentsync:v1";

const defaultState: AppState = {
  profile: null,
  tasks: [],
  timetable: [],
  notes: [],
  revisionDone: [],
  badges: { unlocked: [] },
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

  const update = useCallback((updater: (s: AppState) => AppState) => {
    const next = updater(memoryState);
    if (next === memoryState) return;
    memoryState = next;
    persist(memoryState);
    emit();
  }, []);

  return { state, update };
}

export function resetAll() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  memoryState = { ...defaultState, hydrated: true };
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
