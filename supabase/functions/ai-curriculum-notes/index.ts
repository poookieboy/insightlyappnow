// AI Curriculum Notes — generates grade-aligned study notes with structured sections.
// Cached in public.ai_curriculum_notes so repeat requests are instant.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  curriculum: string;
  grade: string;
  subject: string;
  topic: string;
  force?: boolean;
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { curriculum, grade, subject, topic, force } = (await req.json()) as Body;
    if (!curriculum || !grade || !subject || !topic) return json({ error: "Missing fields" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    if (!force) {
      const { data: cached } = await db
        .from("ai_curriculum_notes")
        .select("body")
        .eq("curriculum", curriculum).eq("grade", grade)
        .eq("subject", subject).eq("topic", topic).maybeSingle();
      if (cached) return json({ body: cached.body, cached: true });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const system = `You are Iris, the study companion inside Insightly. Write clear, curriculum-aligned notes for a ${grade} student following the ${curriculum} curriculum. Return STRICT JSON only.`;

    const user = `Create study notes for:
Subject: ${subject}
Topic: ${topic}
Grade: ${grade}
Curriculum: ${curriculum}

Return JSON with this exact shape:
{
  "overview": "2-3 sentence friendly intro of what this topic is about",
  "learningOutcomes": ["outcome1", "outcome2", "..."],
  "keyTerms": [{"term": "...", "definition": "..."}],
  "sections": [
    {"heading": "...", "body": "detailed explanation in 1-3 paragraphs", "example": "worked example or real-world example"}
  ],
  "diagramDescription": "text describing a labeled diagram (or empty string if none)",
  "practicalActivity": "hands-on activity the learner can do",
  "keyPointsSummary": ["bullet1", "bullet2", "..."],
  "flashcards": [{"front": "question", "back": "answer"}],
  "revisionQuestions": [{"q": "...", "a": "..."}]
}
Aim for: 4-6 sections, 6-10 key terms, 8-12 flashcards, 8-12 revision questions. Age-appropriate for ${grade}.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return json({ error: `AI gateway ${resp.status}`, details: t }, 502);
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let body: any = {};
    try { body = JSON.parse(content); } catch { body = { overview: content }; }

    await db.from("ai_curriculum_notes").upsert({
      curriculum, grade, subject, topic, body,
    }, { onConflict: "curriculum,grade,subject,topic" });

    return json({ body, cached: false });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
