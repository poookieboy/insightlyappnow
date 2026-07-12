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

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl) throw new Error("SUPABASE_URL environment variable not set");
    if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable not set");

    // Create Supabase client
    let db;
    try {
      db = createClient(supabaseUrl, serviceKey);
    } catch (initErr) {
      console.error("Failed to initialize Supabase client:", initErr);
      throw new Error(`Supabase client initialization failed: ${initErr instanceof Error ? initErr.message : String(initErr)}`);
    }

    if (!force) {
      try {
        const { data: cached, error: queryError } = await db
          .from("ai_curriculum_notes")
          .select("body")
          .eq("curriculum", curriculum).eq("grade", grade)
          .eq("subject", subject).eq("topic", topic).maybeSingle();
        
        if (queryError) {
          console.error("Cache query error:", queryError);
        }
        if (cached) return json({ body: cached.body, cached: true });
      } catch (cacheErr) {
        console.error("Cache lookup error:", cacheErr);
        // Continue to AI generation if cache fails
      }
    }

    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("GEMINI_API_KEY not configured");

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
    const resp = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${system}\n\n${user}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  }
);

    

    if (!resp.ok) {
      const t = await resp.text();
      console.error(`AI gateway error ${resp.status}:`, t);
      return json({ error: `AI gateway ${resp.status}`, details: t }, 502);
    }

    const data = await resp.json();
const content =
  data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    try { 
      body = JSON.parse(content); 
    } catch (parseErr) { 
      console.error("Failed to parse AI response:", parseErr);
      body = { overview: content }; 
    }

    try {
      await db.from("ai_curriculum_notes").upsert({
        curriculum, grade, subject, topic, body,
      }, { onConflict: "curriculum,grade,subject,topic" });
    } catch (upsertErr) {
      console.error("Failed to upsert notes:", upsertErr);
      // Don't fail the response - return the body even if cache fails
    }

    return json({ body, cached: false });
  } catch (e) {
    console.error("ai-curriculum-notes error:", e);
    return json({ 
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined
    }, 500);
  }
});
