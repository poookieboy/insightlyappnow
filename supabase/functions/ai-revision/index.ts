// AI Revision — three actions:
//   action="generate" → a fresh detailed question for {subject, topic, subtopic, curriculum, grade}
//   action="mark"     → grades a free-form student answer with feedback
//   action="hint"     → a single nudge (no answer) for when the student is stuck
// Provider: Groq (OpenAI-compatible API). Server-side GROQ_API_KEY only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

interface GenBody {
  action: "generate";
  subject: string;
  topic: string;
  subtopic?: string;
  curriculum: string;
  grade: string;
  difficulty?: "easy" | "medium" | "hard";
  avoid?: string[];
}
interface MarkBody {
  action: "mark";
  question: string;
  modelAnswer: string;
  studentAnswer: string;
  subject?: string;
  curriculum?: string;
  grade?: string;
}
interface HintBody {
  action: "hint";
  question: string;
  modelAnswer: string;
  studentAnswer?: string;
}
type Body = GenBody | MarkBody | HintBody;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body || typeof body.action !== "string") return json({ error: "Missing action." }, 400);

    if (body.action === "generate") {
      const {
        subject,
        topic,
        subtopic,
        curriculum = "CBC",
        grade = "student",
        difficulty = "medium",
        avoid = [],
      } = body;

      if (!subject || !topic) return json({ error: "Subject and topic are required." }, 400);

      const sys = `You write rigorous, exam-quality revision questions for the ${curriculum} curriculum, ${grade}.
Rules:
- Make ONE detailed question that tests deep understanding (not trivia).
- The question must be self-contained, unambiguous, and answerable in 1–6 sentences (or with working shown for maths/science).
- Provide a complete "modelAnswer" the student would aim for. For numeric problems include the final value AND brief working.
- Provide 1–2 short hints that nudge thinking without giving the answer.
- Difficulty: ${difficulty}.
- Return ONLY a JSON object of shape: {"question": string, "modelAnswer": string, "hints": string[]}.`;

      const user = `Subject: ${subject}
Topic: ${topic}${subtopic ? ` › ${subtopic}` : ""}
${avoid.length ? `Avoid repeating any of these recently asked questions: ${avoid.slice(0, 5).join(" | ")}` : ""}`;

      const raw = await callAI(
        [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        { json: true, temperature: 0.85, maxTokens: 2048 },
      );

      const parsed = safeJson<{ question?: string; modelAnswer?: string; hints?: string[] }>(raw);
      if (!parsed?.question || !parsed?.modelAnswer) {
        return json({ error: "The AI returned a malformed question. Please try again." }, 502);
      }

      return json({
        question: String(parsed.question),
        modelAnswer: String(parsed.modelAnswer),
        hints: Array.isArray(parsed.hints) ? parsed.hints.map(String).slice(0, 3) : [],
      });
    }

    if (body.action === "mark") {
      const { question, modelAnswer, studentAnswer, subject, curriculum, grade } = body;
      if (!question || !modelAnswer) return json({ error: "Question and model answer are required." }, 400);
      if (!studentAnswer?.trim()) return json({ correct: false, score: 0, feedback: "No answer provided." });

      const sys = `You are a fair, supportive ${curriculum ?? ""} examiner${grade ? ` for ${grade}` : ""}${subject ? `, subject: ${subject}` : ""}.
Mark the student's answer against the model answer. Accept ANY correct phrasing, working, format, close-enough spelling, and equivalent reasoning — wording need not match the model. Numeric answers must match within a sensible tolerance.

Return ONLY a JSON object: {"correct": boolean, "score": number (0..100), "feedback": string}.
Feedback rules:
- 1–3 short sentences, warm but honest.
- If correct, briefly say WHY it's correct and add one extension tip.
- If partially correct, name what they got right + the specific gap.
- If wrong, point to the misconception (don't just dump the answer). Encourage them to try again.`;

      const user = `Question: ${question}
Model answer: ${modelAnswer}
Student's answer: ${studentAnswer}`;

      const raw = await callAI(
        [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        { json: true, temperature: 0.3, maxTokens: 1024 },
      );

      const parsed = safeJson<{ correct?: boolean; score?: number; feedback?: string }>(raw);
      if (!parsed || typeof parsed.feedback !== "string") {
        return json({ error: "The AI returned malformed marking. Please try again." }, 502);
      }

      const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
      return json({
        correct: Boolean(parsed.correct ?? score >= 70),
        score,
        feedback: parsed.feedback,
      });
    }

    if (body.action === "hint") {
      const { question, modelAnswer, studentAnswer } = body;
      if (!question) return json({ error: "Question is required." }, 400);

      const sys = `You give ONE short hint (max 25 words) that nudges the student toward the answer WITHOUT revealing it. Never state the final answer. Reply with plain text only — no JSON, no quotes, no markdown.`;
      const user = `Question: ${question}
Model answer (for your reference only — do NOT reveal): ${modelAnswer ?? "unknown"}
${studentAnswer ? `What the student tried: ${studentAnswer}` : ""}`;

      const raw = await callAI(
        [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        { temperature: 0.6, maxTokens: 256 },
      );

      return json({ hint: String(raw).trim().replace(/^["']|["']$/g, "") });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e: any) {
    console.error("ai-revision error", e?.message ?? e);
    return json({ error: e?.message ?? "Unknown error" }, e?.status ?? 500);
  }
});
