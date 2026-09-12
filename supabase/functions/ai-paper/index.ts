// AI Paper Generator — produces a structured mock paper (20-30 questions).
// Provider: Groq (OpenAI-compatible API). Server-side GROQ_API_KEY only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface RequestBody {
  subject: string;
  curriculum: string;
  grade: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  questionCount?: number;
}

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

function safeJson<T>(raw: string): T | null {
  let cleaned = String(raw).trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(cleaned) as T; } catch { /* fall through */ }
  const start = cleaned.search(/[[{]/);
  if (start === -1) return null;
  const closer = cleaned[start] === "{" ? "}" : "]";
  const end = cleaned.lastIndexOf(closer);
  if (end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)) as T; } catch { return null; }
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;

    const subject = body.subject || "Mathematics";
    const curriculum = body.curriculum || "CBC";
    const grade = body.grade || "Grade 7";
    const topic = body.topic?.trim() || "general";
    const difficulty = body.difficulty || "medium";
    const count = Math.min(30, Math.max(20, body.questionCount ?? 25));

    const systemPrompt = `You are an expert exam setter who designs age-appropriate mock papers.
Always align to the requested curriculum (e.g. CBC means Kenyan Competency-Based Curriculum).
Mix multiple-choice and short-answer questions. About 60% MCQ, 40% short answer.
Make MCQ options plausible. Short-answer model answers must be concise (1-6 words) so they can be auto-graded.
Provide acceptable alternative spellings/phrasings for short answers.
Return STRICT JSON only.`;

    const userPrompt = `Create a complete mock paper.
Subject: ${subject}
Curriculum: ${curriculum}
Grade: ${grade}
Topic focus: ${topic}
Difficulty: ${difficulty}
Number of questions: ${count}

Return JSON of this exact shape:
{
  "title": "creative paper title",
  "emoji": "one emoji",
  "topic": "${topic}",
  "durationMinutes": <integer>,
  "questions": [
    {"kind":"mcq","prompt":"...","options":["A","B","C","D"],"correctIndex":0,"marks":1},
    {"kind":"short","prompt":"...","modelAnswer":"...","acceptable":["..."],"marks":2}
  ]
}`;

    const resp = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_completion_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    });

    const text = await resp.text();

    if (!resp.ok) {
      console.error("Groq error", resp.status, text.slice(0, 400));
      if (resp.status === 429) return json({ error: "The AI service is busy right now. Please try again shortly." }, 429);
      if (resp.status === 401 || resp.status === 403) return json({ error: "The AI service key is invalid or not authorized." }, 500);
      return json({ error: `AI service error (${resp.status}).` }, 502);
    }

    let data: any;
    try { data = JSON.parse(text); } catch { return json({ error: "Invalid response from the AI service." }, 502); }

    const content = data?.choices?.[0]?.message?.content ?? "";
    const args = safeJson<any>(content);

    if (!args?.questions?.length) {
      return json({ error: "The AI returned a malformed paper. Please try again." }, 502);
    }

    return json({ ...args, subject, curriculum, grade, difficulty });
  } catch (e: any) {
    console.error("ai-paper error", e?.message ?? e);
    return json({ error: e?.message ?? "Unknown error" }, e?.status ?? 500);
  }
});
