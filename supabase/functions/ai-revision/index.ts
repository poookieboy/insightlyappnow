// AI Revision — two actions:
//   action="generate" → returns a fresh detailed question for {subject, topic, subtopic, curriculum, grade}
//   action="mark"     → grades a free-form student answer with feedback
//   action="hint"     → returns a single nudge (no answer) for when the student is stuck

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

async function callAI(
  messages: { role: string; content: string }[],
  jsonMode = true,
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
            temperature: 0.8,
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
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]) as T; } catch { return null; }
  }
}
// -----------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;

    if (body.action === "generate") {
      const { subject, topic, subtopic, curriculum, grade, difficulty = "medium", avoid = [] } = body;
      const sys = `You write rigorous, exam-quality revision questions for the ${curriculum} curriculum, ${grade}.
Rules:
- Make ONE detailed question that tests deep understanding (not trivia).
- Question must be self-contained, unambiguous, and answerable in 1–6 sentences (or with working shown for math/science).
- Provide a complete "modelAnswer" the student would aim for. For numeric problems, include the final value AND brief working.
- Provide 1–2 short hints that nudge thinking without giving the answer.
- Difficulty: ${difficulty}.
- Return ONLY JSON of shape: {"question": string, "modelAnswer": string, "hints": string[]}.`;
      const user = `Subject: ${subject}
Topic: ${topic}${subtopic ? ` › ${subtopic}` : ""}
${avoid.length ? `Avoid repeating any of these recently asked questions: ${avoid.slice(0, 5).join(" | ")}` : ""}`;

      const raw = await callAI([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);
      const parsed = safeJson<{ question: string; modelAnswer: string; hints?: string[] }>(raw);
      if (!parsed?.question || !parsed?.modelAnswer) return json({ error: "AI returned malformed question" }, 500);
      return json(parsed);
    }

    if (body.action === "mark") {
      const { question, modelAnswer, studentAnswer, subject, curriculum, grade } = body;
      if (!studentAnswer?.trim()) return json({ correct: false, score: 0, feedback: "No answer provided." });
      const sys = `You are a fair, supportive ${curriculum ?? ""} examiner${grade ? ` for ${grade}` : ""}${subject ? `, subject: ${subject}` : ""}.
Mark the student's answer against the model answer. Accept ANY correct phrasing, working, format, spelling close enough, and equivalent reasoning — wording need not match the model. Numeric answers must match within a sensible tolerance.

Return ONLY JSON: {"correct": boolean, "score": number (0..100), "feedback": string}.
Feedback rules:
- 1–3 short sentences, warm but honest.
- If correct, briefly say WHY it's correct and add one extension tip.
- If partially correct, name what they got right + the specific gap.
- If wrong, point to the misconception (don't just dump the answer). Encourage them to try again.`;
      const user = `Question: ${question}
Model answer: ${modelAnswer}
Student's answer: ${studentAnswer}`;
      const raw = await callAI([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);
      const parsed = safeJson<{ correct: boolean; score: number; feedback: string }>(raw);
      if (!parsed) return json({ error: "AI returned malformed marking" }, 500);
      return json(parsed);
    }

    if (body.action === "hint") {
      const { question, modelAnswer, studentAnswer } = body;
      const sys = `You give ONE short hint (max 25 words) that nudges the student toward the answer WITHOUT revealing it. Never state the final answer. Return plain text only, no JSON.`;
      const user = `Question: ${question}
Model answer (for your reference only — do NOT reveal): ${modelAnswer}
${studentAnswer ? `What the student tried: ${studentAnswer}` : ""}`;
      const raw = await callAI([
        { role: "system", content: sys },
        { role: "user", content: user },
      ], false);
      return json({ hint: String(raw).trim() });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    if (e.status === 429) return json({ error: "Rate limited. Please try again in a moment." }, 429);
    if (e.status === 402) return json({ error: "AI credits exhausted." }, 402);
    console.error("ai-revision error", e);
    return json({ error: e?.message ?? "Unknown error" }, 500);
  }
});
