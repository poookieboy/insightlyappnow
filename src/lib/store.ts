// Local storage-backed store for StudentSync.
// Simple, beginner-friendly, no backend required.

import { useEffect, useState, useCallback } from "react";

export type Curriculum = "CBC" | "IGCSE" | "Cambridge" | "British" | "American" | "IB";
export type Grade =
  | "Grade 1" | "Grade 2" | "Grade 3" | "Grade 4" | "Grade 5" | "Grade 6"
  | "Grade 7" | "Grade 8" | "Grade 9" | "Grade 10" | "Grade 11" | "Grade 12";

export interface Profile {
  name: string;
  dob: string; // ISO date
  curriculum: Curriculum;
  grade: Grade;
  createdAt: string;
  lastActive: string;
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO datetime
  completed: boolean;
  completedAt?: string;
  onTime?: boolean;
}

export interface TimetableEntry {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  time: string; // "HH:MM"
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
  unlocked: string[]; // badge ids
}

const KEY = "studentsync:v1";

interface AppState {
  profile: Profile | null;
  tasks: Task[];
  timetable: TimetableEntry[];
  notes: Note[];
  revisionDone: RevisionDone[];
  badges: BadgeState;
}

const defaultState: AppState = {
  profile: null,
  tasks: [],
  timetable: [],
  notes: [],
  revisionDone: [],
  badges: { unlocked: [] },
};

function read(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function write(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("studentsync:update"));
}

export function useStore() {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    setState(read());
    const onUpdate = () => setState(read());
    window.addEventListener("studentsync:update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("studentsync:update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    const next = updater(read());
    write(next);
    setState(next);
  }, []);

  return { state, update };
}

export function resetAll() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("studentsync:update"));
}

export function calcAge(dob: string): number {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
