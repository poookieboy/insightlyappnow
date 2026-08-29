import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Body = {
  curriculum: string;
  grade: string;
  subject: string;
  topic: string;
  force?: boolean;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const {
      curriculum,
      grade,
      subject,
      topic,
      force,
    } = (await req.json()) as Body;

    if (!curriculum || !grade || !subject || !topic) {
      return json(
        {
          error: "Missing fields",
        },
        400,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!supabaseUrl) {
      throw new Error(
        "SUPABASE_URL environment variable not set",
      );
    }

    if (!serviceKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY environment variable not set",
      );
    }

    const db = createClient(
      supabaseUrl,
      serviceKey,
    );

    // Check cached notes first.
    if (!force) {
      try {
        const {
          data: cached,
          error: queryError,
        } = await db
          .from("ai_curriculum_notes")
          .select("body")
          .eq("curriculum", curriculum)
          .eq("grade", grade)
          .eq("subject", subject)
          .eq("topic", topic)
          .maybeSingle();

        if (queryError) {
          console.error(
            "Cache query error:",
            queryError,
          );
        }

        if (cached) {
          return json({
            body: cached.body,
            cached: true,
          });
        }
      } catch (cacheError) {
        console.error(
          "Cache lookup error:",
          cacheError,
        );
      }
    }

    const key = Deno.env.get("GEMINI_API_KEY");

    if (!key) {
      throw new Error(
        "GEMINI_API_KEY not configured",
      );
    }

    const system = `
You are Iris, the study companion inside Insightly.

Write clear, curriculum-aligned study notes for a ${grade} student following the ${curriculum} curriculum.

Return STRICT JSON only.
`;

    const user = `
Create study notes for:

Subject: ${subject}
Topic: ${topic}
Grade: ${grade}
Curriculum: ${curriculum}

Return JSON with this exact shape:

{
  "overview": "2-3 sentence friendly intro of what this topic is about",
  "learningOutcomes": ["outcome1", "outcome2", "..."],
  "keyTerms": [
    {
      "term": "...",
      "definition": "..."
    }
  ],
  "sections": [
    {
      "heading": "...",
      "body": "detailed explanation in 1-3 paragraphs",
      "example": "worked example or real-world example"
    }
  ],
  "diagramDescription": "text describing a labeled diagram or empty string",
  "practicalActivity": "hands-on activity the learner can do",
  "keyPointsSummary": ["bullet1", "bullet2", "..."],
  "flashcards": [
    {
      "front": "question",
      "back": "answer"
    }
  ],
  "revisionQuestions": [
    {
      "q": "...",
      "a": "..."
    }
  ]
}

Aim for:

- 4-6 sections
- 6-10 key terms
- 8-12 flashcards
- 8-12 revision questions
- Age-appropriate language
- Curriculum alignment
`;

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        key,
      )}`;

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
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
    });

    if (!resp.ok) {
      const errorText = await resp.text();

      console.error(
        `Gemini API error ${resp.status}:`,
        errorText,
      );

      return json(
        {
          error: `AI gateway ${resp.status}`,
          details: errorText,
        },
        502,
      );
    }

    const data = await resp.json();

    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "{}";

    let body: any;

    try {
      body = JSON.parse(content);
    } catch (parseError) {
      console.error(
        "Failed to parse AI response:",
        parseError,
      );

      body = {
        overview: content,
      };
    }

    try {
      const { error: upsertError } = await db
        .from("ai_curriculum_notes")
        .upsert(
          {
            curriculum,
            grade,
            subject,
            topic,
            body,
          },
          {
            onConflict:
              "curriculum,grade,subject,topic",
          },
        );

      if (upsertError) {
        console.error(
          "Failed to cache notes:",
          upsertError,
        );
      }
    } catch (upsertError) {
      console.error(
        "Cache upsert error:",
        upsertError,
      );
    }

    return json({
      body,
      cached: false,
    });
  } catch (error) {
    console.error(
      "ai-curriculum-notes error:",
      error,
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500,
    );
  }
});
