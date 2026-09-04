// AI exam analysis — given a student's results, return strengths, weaknesses, tips.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubjectScore {
  subject: string;
  score: number;
  outOf: number;
}

interface Body {
  results: SubjectScore[];
  grade?: string;
  curriculum?: string;
  goal?: string;
  notes?: string;
}

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
    const { results, grade, curriculum, goal, notes } = (await req.json()) as Body;
    if (!Array.isArray(results) || results.length === 0) throw new Error("No results provided");

    const lines = results.map(r => `- ${r.subject}: ${r.score}/${r.outOf} (${Math.round((r.score / Math.max(1, r.outOf)) * 100)}%)`).join("\n");
    const sys = `You are Iris, a supportive ${curriculum ?? "CBC"} study coach on Insightly, helping a ${grade ?? "student"}.
Given a student's exam results, give them a kind, honest analysis:
1. **Overall** — one-line summary with overall %
2. **Strengths** — top 2 subjects + why that's good
3. **Focus areas** — 2-3 weakest subjects with specific study tips (topics to revise, practice techniques)
4. **Study plan** — a concrete 7-day plan tailored to the weak areas
5. **Goal check** — if a goal is given, say how close they are and what to change

Be encouraging, use bullets, use bold. Never shame the student.`;

    const user = `My results:\n${lines}\n${goal ? `\nMy goal: ${goal}` : ""}${notes ? `\n\nExtra context: ${notes}` : ""}`;

    const content = await callAI([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
    return json({ content });
  } catch (e: any) {
    if (e?.status === 429) return json({ error: "Rate limited. Try again soon." }, 429);
    if (e?.status === 402) return json({ error: "AI credits exhausted." }, 402);
    console.error("ai-exam error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
