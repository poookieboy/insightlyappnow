// External Supabase client — read-only quiz_questions source.
// Separate from the main Lovable Cloud client so app auth/data stays intact.
import { createClient } from "@supabase/supabase-js";

const EXTERNAL_URL = "https://xprysgjlwouonpylgusb.supabase.co";
const EXTERNAL_PUBLISHABLE_KEY = "sb_publishable_Cdh8umqD_Z49bAJ2VcW2nQ_OXDJhMZ6";

// Raw row shape as stored in the external `quiz_questions` table.
export interface QuizQuestionRow {
  id: string | number;
  created_at?: string;
  subject: string;
  topic: string | null;
  difficulty: string | null;
  question: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string | null;
  sample_answer: string | null;
  explanation: string | null;
  marks: number | null;
  question_type: "multiple_choice" | "written" | string;
}

// Normalized shape used by the UI.
export interface QuizQuestion {
  id: string | number;
  subject: string;
  topic: string | null;
  difficulty: string | null;
  type: "multiple_choice" | "written";
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  max: number;
}

export function normalizeQuestion(r: QuizQuestionRow): QuizQuestion {
  const type: "multiple_choice" | "written" =
    r.question_type === "written" ? "written" : "multiple_choice";
  const opts = [r.option_a, r.option_b, r.option_c, r.option_d]
    .map((o) => (o ?? "").toString().trim())
    .filter(Boolean);
  // correct_answer may be stored as a letter ("A".."D") or as full option text.
  let correct = (r.correct_answer ?? r.sample_answer ?? "").toString().trim();
  if (type === "multiple_choice" && /^[A-Da-d]$/.test(correct)) {
    const idx = correct.toUpperCase().charCodeAt(0) - 65;
    correct = opts[idx] ?? correct;
  }
  return {
    id: r.id,
    subject: r.subject,
    topic: r.topic,
    difficulty: r.difficulty,
    type,
    question: r.question,
    options: type === "multiple_choice" ? opts : null,
    correct_answer: correct,
    explanation: r.explanation,
    max: Number(r.marks ?? 1),
  };
}

export const externalSupabase = createClient(EXTERNAL_URL, EXTERNAL_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
});
