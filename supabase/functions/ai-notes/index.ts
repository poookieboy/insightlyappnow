// AI Notes helper — summarize, simplify, or turn notes into practice questions.
// Provider: Groq (OpenAI-compatible API). Server-side GROQ_API_KEY only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action = "summarize" | "simplify" | "quiz" | "exam";

interface Body {
  action: Action;
  text: string;
  subject?: string;
  grade?: string;
  curriculum?: string;
}

const ACTION_PROMPTS: Record<Action, string> = {
  summarize:
    "Summarize the student's notes into clear bullet points under short headings. Keep every important fact. End with a 1-line TL;DR.",
  simplify:
    "Rewrite the student's notes in VERY simple language (as if explaining to a younger student). Use short sentences, concrete examples, and analogies.",
  quiz:
    "Turn these notes into 6 practice questions. Mix MCQ-style and short-answer. After ALL questions, add '---' then list the answers with brief explanations. Do NOT give answers before the student sees the questions.",
  exam:
    "Rewrite the key points from these notes in exam-style model answers — structured paragraphs with topic sentences, evidence/examples, and an evaluation/conclusion. Use headings per sub-topic.",
};

const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface AIMessage { role: string; content: string }
interface AIOptions { json?: boolean; temperature?: number; maxTokens?: number }

class AIError extends Error {
  status: number;
  constructor(message: string, status = 500) { super(message); this.status = status; }
}

function groqKey(): string {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) {
    throw new AIError(
      "AI is not configured on the server. Add the GROQ_API_KEY secret in Project Settings → Secrets.",
      500,
    );
  }
  return key;
}

async function callAI(messages: AIMessage[], opts: AIOptions = {}): Promise<string> {
  const clean = messages.filter((m) => m.content && String(m.content).trim());
  if (!clean.length) throw new AIError("No messages provided.", 400);

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: clean,
      temperature: opts.temperature ?? 0.7,
      max_completion_tokens: opts.maxTokens ?? 4096,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const text = await resp.text();
  if (!resp.ok) {
    console.error("Groq error", resp.status, text.slice(0, 400));
    if (resp.status === 401 || resp.status === 403) throw new AIError("The AI service key is invalid or not authorized.", 500);
    if (resp.status === 429) throw new AIError("The AI service is busy right now. Please try again shortly.", 429);
    throw new AIError(`AI service error (${resp.status}).`, 502);
  }

  let data: any;
  try { data = JSON.parse(text); } catch { throw new AIError("Invalid response from the AI service.", 502); }
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new AIError("The AI service returned no answer.", 502);
  return content;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, subject, grade, curriculum } = (await req.json()) as Body;
    if (!text || !action || !ACTION_PROMPTS[action]) {
      return json({ error: "Missing or invalid text/action." }, 400);
    }

    const sys = `You are Iris — a warm, encouraging study coach for Insightly students.
Student context: ${curriculum ?? "CBC"} curriculum, ${grade ?? "unspecified grade"}${subject ? `, subject: ${subject}` : ""}.
${ACTION_PROMPTS[action]}
Use markdown headings, bold and bullets. Keep language age-appropriate.`;

    const content = await callAI(
      [
        { role: "system", content: sys },
        { role: "user", content: text.slice(0, 8000) },
      ],
      { temperature: 0.6, maxTokens: 4096 },
    );

    return json({ content });
  } catch (e: any) {
    console.error("ai-notes error", e?.message ?? e);
    return json({ error: e?.message ?? "Unknown error" }, e?.status ?? 500);
  }
});
