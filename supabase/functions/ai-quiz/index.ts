// AI Quiz — generates a subject quiz (10 MCQ + 10 written) with metadata, and marks written answers.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// ---- AI helper (Gemini first, legacy gateway fallback) ----
const GEMINI_MODEL = "gemini-2.5-flash";

function geminiKey(): string | undefined {
  return (
    Deno.env.get("GEMINI_API_KEY") ||
    Deno.env.get("GOOGLE_API_KEY") ||
    Deno.env.get("GOOGLE_GEMINI_API_KEY") ||
    undefined
  );
}

async function callAIRaw(
  messages: { role: string; content: string }[],
  jsonMode = false,
): Promise<string> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))
    .filter((m) => m.parts[0].text?.trim());

  const key = geminiKey();
  if (key) {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            ...(jsonMode ? { responseMimeType: "application/json" } : {}),
          },
        }),
      },
    );
    const text = await resp.text();
    if (!resp.ok) {
      console.error("Gemini error", resp.status, text.slice(0, 400));
      const err: any = new Error(`AI service error (${resp.status})`);
      err.status = resp.status;
      throw err;
    }
    const data = JSON.parse(text);
    return data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";
  }

  const legacy = Deno.env.get("LOVABLE_API_KEY");
  if (legacy) {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${legacy}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error("AI gateway error", resp.status, body.slice(0, 400));
      const err: any = new Error(`AI service error (${resp.status})`);
      err.status = resp.status;
      throw err;
    }
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }

  const err: any = new Error(
    "AI is not configured on the server. Add the GEMINI_API_KEY secret in Project Settings → Secrets.",
  );
  err.status = 500;
  throw err;
}

function safeJson<T>(raw: string): T | null {
  const cleaned = String(raw).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(cleaned) as T; } catch {
    const m = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (!m) return null;
    try { return JSON.parse(m[0]) as T; } catch { return null; }
  }
}

async function callAI(messages: { role: string; content: string }[]) {
  return safeJson<any>(await callAIRaw(messages, true)) ?? {};
}
// -----------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;

    if (body.action === "generate") {
      const { subject, grade, curriculum, difficulty = "medium", topics = [] } = body;
      const topicHint = topics.length ? `Cover these topics: ${topics.join(", ")}.` : `Cover the main topics of ${subject} at ${grade} level.`;
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
      const result = await callAI([{ role: "system", content: system }, { role: "user", content: user }]);
      return json({ quiz: result });
    }

    if (body.action === "mark") {
      const { question, modelAnswer, studentAnswer, subject, grade } = body;
      const system = `You are a fair, encouraging examiner for ${grade ?? "school"} ${subject ?? ""}. Return STRICT JSON.`;
      const user = `Question: ${question}
Model answer: ${modelAnswer}
Student answer: ${studentAnswer}

Award a score from 0 to 5 based on correctness, completeness, and clarity. Ignore spacing/word-order issues. Accept any correct wording.
Return: {"score": <0-5>, "outOf": 5, "correct": <true|false>, "feedback": "short helpful feedback (2-3 sentences)", "improvementTip": "one specific tip"}`;
      const result = await callAI([{ role: "system", content: system }, { role: "user", content: user }]);
      return json(result);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    if (e?.status === 429) return json({ error: "Rate limited. Please try again in a moment." }, 429);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
