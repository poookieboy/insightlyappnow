// External Supabase client — read-only quiz_questions source.
// Separate from the main Lovable Cloud client so app auth/data stays intact.
import { createClient } from "@supabase/supabase-js";

const EXTERNAL_URL = "https://xprysgjlwouonpylgusb.supabase.co";
const EXTERNAL_PUBLISHABLE_KEY = "sb_publishable_Cdh8umqD_Z49bAJ2VcW2nQ_OXDJhMZ6";

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

export const externalSupabase = createClient(EXTERNAL_URL, EXTERNAL_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
});
