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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, subject, grade, curriculum } = (await req.json()) as Body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!text || !action) throw new Error("Missing text or action");

    const sys = `You are Nexus — a warm, encouraging study coach for students.
Student context: ${curriculum ?? "CBC"} curriculum, ${grade ?? "unspecified grade"}${subject ? `, subject: ${subject}` : ""}.
${ACTION_PROMPTS[action]}
Use markdown headings, bold and bullets. Keep language age-appropriate.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: text.slice(0, 8000) },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return json({ error: "Rate limited. Try again soon." }, 429);
      if (resp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return json({ content });
  } catch (e) {
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
