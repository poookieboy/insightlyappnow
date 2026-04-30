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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { results, grade, curriculum, goal, notes } = (await req.json()) as Body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!Array.isArray(results) || results.length === 0) throw new Error("No results provided");

    const lines = results.map(r => `- ${r.subject}: ${r.score}/${r.outOf} (${Math.round((r.score / Math.max(1, r.outOf)) * 100)}%)`).join("\n");
    const sys = `You are Nexus, a supportive ${curriculum ?? "CBC"} study coach for a ${grade ?? "student"}.
Given a student's exam results, give them a kind, honest analysis:
1. **Overall** — one-line summary with overall %
2. **Strengths** — top 2 subjects + why that's good
3. **Focus areas** — 2-3 weakest subjects with specific study tips (topics to revise, practice techniques)
4. **Study plan** — a concrete 7-day plan tailored to the weak areas
5. **Goal check** — if a goal is given, say how close they are and what to change

Be encouraging, use bullets, use bold. Never shame the student.`;

    const user = `My results:\n${lines}\n${goal ? `\nMy goal: ${goal}` : ""}${notes ? `\n\nExtra context: ${notes}` : ""}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return json({ error: "Rate limited. Try again soon." }, 429);
      if (resp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const t = await resp.text();
      console.error("ai-exam gateway error", resp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }
    const data = await resp.json();
    return json({ content: data.choices?.[0]?.message?.content ?? "" });
  } catch (e) {
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
