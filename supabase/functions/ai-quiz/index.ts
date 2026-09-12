// AI Quiz — generates a subject quiz (10 MCQ + 10 written) with metadata, and marks written answers.
// Provider: Groq (OpenAI-compatible API). Server-side GROQ_API_KEY only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GenBody {
  action: "generate";
  subject: string;
  grade: string;
  curriculum: string;
  difficulty?: "easy" | "medium" | "hard";
  topics?: string[];
}

interface MarkBody {
  action: "mark";
  question: string;
  modelAnswer: string;
  studentAnswer: string;
  subject?: string;
  grade?: string;
}

type Body = GenBody | MarkBody;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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

async function callAIRaw(messages: AIMessage[], opts: AIOptions = {}): Promise<string> {
  const clean = messages.filter((m) => m.content && String(m.content).trim());
  if (!clean.length) throw new AIError("No messages provided.", 400);

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: clean,
      temperature: opts.temperature ?? 0.7,
      max_completion_tokens: opts.maxTokens ?? 8192,
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

async function callAI(messages: AIMessage[], opts: AIOptions = {}) {
  return safeJson<any>(await callAIRaw(messages, { ...opts, json: true })) ?? {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;

    if (body.action === "generate") {
      const { subject, grade, curriculum, difficulty = "medium", topics = [] } = body;
      if (!subject) return json({ error: "Subject is required." }, 400);

      const topicHint = topics.length
        ? `Cover these topics: ${topics.join(", ")}.`
        : `Cover the main topics of ${subject} at ${grade} level.`;
      const system = `You write ${curriculum}-aligned quizzes for ${grade} students. Realistic ${difficulty} difficulty. Return STRICT JSON.`;
      const user = `Create a quiz for Subject: ${subject}. ${topicHint}
Return JSON: {
  "difficulty": "${difficulty}",
  "estimatedMinutes": <integer 15-45>,
  "topicsCovered": ["..."],
  "mcq": [
    {"id":"m1","question":"...","options":["A","B","C","D"],"correctIndex":0,"topic":"..."}
    // exactly 10 items
  ],
  "written": [
    {"id":"w1","question":"...","modelAnswer":"a full ideal answer","marks":5,"topic":"..."}
    // exactly 10 items
  ]
}
Make MCQs discriminating (no giveaway options). Written questions require 3-6 sentence answers.`;
      const result = await callAI(
        [{ role: "system", content: system }, { role: "user", content: user }],
        { temperature: 0.8 },
      );
      return json({ quiz: result });
    }

    if (body.action === "mark") {
      const { question, modelAnswer, studentAnswer, subject, grade } = body;
      if (!question) return json({ error: "Question is required." }, 400);

      const system = `You are a fair, encouraging examiner for ${grade ?? "school"} ${subject ?? ""}. Return STRICT JSON.`;
      const user = `Question: ${question}
Model answer: ${modelAnswer}
Student answer: ${studentAnswer}

Award a score from 0 to 5 based on correctness, completeness, and clarity. Ignore spacing/word-order issues. Accept any correct wording.
Return: {"score": <0-5>, "outOf": 5, "correct": <true|false>, "feedback": "short helpful feedback (2-3 sentences)", "improvementTip": "one specific tip"}`;
      const result = await callAI(
        [{ role: "system", content: system }, { role: "user", content: user }],
        { temperature: 0.3, maxTokens: 1024 },
      );
      return json(result);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("ai-quiz error", e?.message ?? e);
    return json({ error: e?.message ?? "Unknown error" }, e?.status ?? 500);
  }
});
