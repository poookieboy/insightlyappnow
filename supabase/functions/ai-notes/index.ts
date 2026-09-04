// AI Notes helper — summarize, simplify, or turn notes into practice questions.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
// -----------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, subject, grade, curriculum } = (await req.json()) as Body;
    if (!text || !action) throw new Error("Missing text or action");

    const sys = `You are Iris — a warm, encouraging study coach for Insightly students.
Student context: ${curriculum ?? "CBC"} curriculum, ${grade ?? "unspecified grade"}${subject ? `, subject: ${subject}` : ""}.
${ACTION_PROMPTS[action]}
Use markdown headings, bold and bullets. Keep language age-appropriate.`;

    const content = await callAI([
      { role: "system", content: sys },
      { role: "user", content: text.slice(0, 8000) },
    ]);

    return json({ content });
  } catch (e: any) {
    if (e?.status === 429) return json({ error: "Rate limited. Try again soon." }, 429);
    if (e?.status === 402) return json({ error: "AI credits exhausted." }, 402);
    console.error("ai-notes error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
