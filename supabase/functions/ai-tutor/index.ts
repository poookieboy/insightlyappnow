// AI Tutor edge function — streams responses from Lovable AI Gateway.
// Acts as a friendly study assistant for students (ChatGPT/Copilot style).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  mode?: "ask" | "explain" | "quiz" | "diagram" | "project";
  profile?: {
    name?: string;
    grade?: string;
    curriculum?: string;
  };
  projectInstructions?: string | null;
  projectName?: string | null;
}

const MODE_INSTRUCTIONS: Record<string, string> = {
  ask: "Be conversational like ChatGPT. Answer clearly, then offer a follow-up question.",
  explain: "Always answer with NUMBERED step-by-step explanations. Define terms, give a worked example, and end with a 1-line summary.",
  quiz: "Quiz the student. Ask ONE question at a time, wait for their answer, then mark it (✅/❌) and explain. Track score across the chat.",
  diagram: "ALWAYS include a Mermaid diagram (flowchart, sequence, or pie chart) inside a ```mermaid code block, then explain it briefly underneath.",
  project: "Help the student plan and build a school project. Suggest a structure (intro, materials, method, results, conclusion), then guide step by step.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, profile, mode, projectInstructions, projectName } = (await req.json()) as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const profileLine = profile
      ? `The student is ${profile.name ?? "a student"}, in ${profile.grade ?? "an unspecified grade"} following the ${profile.curriculum ?? "standard"} curriculum.`
      : "";

    const modeLine = mode && MODE_INSTRUCTIONS[mode] ? `\nMODE: ${mode.toUpperCase()} — ${MODE_INSTRUCTIONS[mode]}` : "";

    const projectLine = projectInstructions
      ? `\nPROJECT CONTEXT (${projectName ?? "Unnamed"}): ${projectInstructions}\nFollow the project instructions above in every reply in this conversation.`
      : "";

    const systemPrompt = `You are Nexus — the friendly AI study companion inside Insightly (the all-in-one student app). Always refer to the app as "Insightly" and to yourself as "Nexus". Never say "Student Sync" or "StudentSync".
${profileLine}${modeLine}${projectLine}

How you help:
- Answer academic questions clearly. For procedural topics (math, science problems, essay structure), explain STEP BY STEP using numbered steps.
- Use short paragraphs and bullet points. Keep language age-appropriate.
- For math, show working line by line. For concepts, give a definition + a quick example.
- If the student seems stuck, ask one guiding question instead of giving the full answer outright.
- Use markdown (headings, bold, lists, code blocks) to format responses.

DIAGRAMS — when a visual would help (cycles, processes, structures, flows, comparisons), include a Mermaid diagram inside a fenced code block tagged \`mermaid\`. Use simple, valid Mermaid syntax.

- Never invent facts. If unsure, say so and suggest where to look.
- Be encouraging — celebrate effort with short, genuine notes (no excessive emoji).`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit reached. Please wait a moment and try again.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-tutor error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
