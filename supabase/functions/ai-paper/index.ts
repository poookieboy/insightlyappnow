// AI Paper Generator — uses Lovable AI Gateway with tool-calling to produce
// a structured mock paper (20-30 questions) for a given subject/grade/curriculum.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  subject: string;
  curriculum: string;
  grade: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  questionCount?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const subject = body.subject || "Mathematics";
    const curriculum = body.curriculum || "CBC";
    const grade = body.grade || "Grade 7";
    const topic = body.topic?.trim() || "general";
    const difficulty = body.difficulty || "medium";
    const count = Math.min(30, Math.max(20, body.questionCount ?? 25));

    const systemPrompt = `You are an expert exam setter who designs age-appropriate mock papers.
Always align to the requested curriculum (e.g. CBC means Kenyan Competency-Based Curriculum).
Mix multiple-choice and short-answer questions. About 60% MCQ, 40% short answer.
Make MCQ options plausible. Short-answer model answers must be concise (1-6 words) so they can be auto-graded.
Provide acceptable alternative spellings/phrasings for short answers.`;

    const userPrompt = `Create a complete mock paper.
Subject: ${subject}
Curriculum: ${curriculum}
Grade: ${grade}
Topic focus: ${topic}
Difficulty: ${difficulty}
Number of questions: ${count}
Include a creative title, an emoji, and a sensible duration in minutes.`;

    const tool = {
      type: "function",
      function: {
        name: "create_paper",
        description: "Return a mock paper",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            emoji: { type: "string" },
            topic: { type: "string" },
            durationMinutes: { type: "number" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  kind: { type: "string", enum: ["mcq", "short"] },
                  prompt: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correctIndex: { type: "number" },
                  modelAnswer: { type: "string" },
                  acceptable: { type: "array", items: { type: "string" } },
                  marks: { type: "number" },
                },
                required: ["kind", "prompt", "marks"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "emoji", "topic", "durationMinutes", "questions"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "create_paper" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again soon." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No tool call in AI response");
    const args = JSON.parse(call.function.arguments);

    return new Response(
      JSON.stringify({
        ...args,
        subject,
        curriculum,
        grade,
        difficulty,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-paper error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
