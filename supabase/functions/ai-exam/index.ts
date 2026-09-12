// AI exam analysis — given a student's results, return strengths, weaknesses, tips.
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface SubjectScore { subject: string; score: number; outOf: number }
interface Body {
  results: SubjectScore[];
  grade?: string;
  curriculum?: string;
  goal?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { results, grade, curriculum, goal, notes } = (await req.json()) as Body;

    if (!Array.isArray(results) || results.length === 0) {
      return json({ error: "No results provided." }, 400);
    }

    const clean = results
      .filter((r) => r && typeof r.subject === "string")
      .map((r) => ({
        subject: r.subject,
        score: Number(r.score) || 0,
        outOf: Math.max(1, Number(r.outOf) || 100),
      }));

    if (!clean.length) return json({ error: "Results are missing subject scores." }, 400);

    const lines = clean
      .map((r) => `- ${r.subject}: ${r.score}/${r.outOf} (${Math.round((r.score / r.outOf) * 100)}%)`)
      .join("\n");

    const sys = `You are Iris, a supportive ${curriculum ?? "CBC"} study coach on Insightly, helping a ${grade ?? "student"}.
Given a student's exam results, give them a kind, honest analysis:
1. **Overall** — one-line summary with overall %
2. **Strengths** — top 2 subjects + why that's good
3. **Focus areas** — 2-3 weakest subjects with specific study tips (topics to revise, practice techniques)
4. **Study plan** — a concrete 7-day plan tailored to the weak areas
5. **Goal check** — if a goal is given, say how close they are and what to change

Be encouraging, use bullets, use bold markdown. Never shame the student.`;

    const user = `My results:\n${lines}\n${goal ? `\nMy goal: ${goal}` : ""}${notes ? `\n\nExtra context: ${notes}` : ""}`;

    const content = await callAI(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { temperature: 0.6, maxTokens: 4096 },
    );

    return json({ content });
  } catch (e: any) {
    console.error("ai-exam error", e?.message ?? e);
    return json({ error: e?.message ?? "Unknown error" }, e?.status ?? 500);
  }
});
