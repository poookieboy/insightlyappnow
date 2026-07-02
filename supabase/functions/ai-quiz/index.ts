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

async function callAI(messages: { role: string; content: string }[]) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) throw new Error(`AI gateway ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(content); } catch { return {}; }
}

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
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
