// AI classifier — detects the subject + a short title for a chat message.
// Provider: Groq (OpenAI-compatible API). Server-side GROQ_API_KEY only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Science", "Biology", "Chemistry", "Physics",
  "Geography", "History", "CRE", "Agriculture", "Home Science", "Pre-Technical Studies",
  "Business Studies", "Computer Studies", "Social Studies", "Other",
];

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const fallback = (message?: string) => ({
    subject: "Other",
    title: (message || "New chat").slice(0, 40),
  });

  let message = "";
  try {
    ({ message } = (await req.json()) as { message: string });

    const raw = await callAI(
      [
        {
          role: "system",
          content: `Classify the student's chat message into one of these subjects (pick "Other" if none fits): ${SUBJECTS.join(", ")}. Also produce a short 2-5 word title. Return ONLY JSON: {"subject": string, "title": string}.`,
        },
        { role: "user", content: (message || "").slice(0, 500) },
      ],
      { json: true, temperature: 0.2, maxTokens: 256 },
    );

    const parsed = safeJson<{ subject?: string; title?: string }>(raw);
    return new Response(
      JSON.stringify({
        subject: SUBJECTS.includes(parsed?.subject ?? "") ? parsed!.subject : "Other",
        title: parsed?.title || (message || "New chat").slice(0, 40),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-classify error", e);
    // Classification is non-critical — degrade gracefully instead of failing the chat.
    return new Response(JSON.stringify(fallback(message)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
