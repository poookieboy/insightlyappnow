// AI classifier — detects the subject + a short title for a chat message.
// Uses Google Gemini directly (server-side key only).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Science", "Biology", "Chemistry", "Physics",
  "Geography", "History", "CRE", "Agriculture", "Home Science", "Pre-Technical Studies",
  "Business Studies", "Computer Studies", "Social Studies", "Other",
];

// ---- shared AI helper (inline: edge functions can't share modules here) ----
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

function safeJson<T>(raw: string): T | null {
  const cleaned = String(raw).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(cleaned) as T; } catch {
    const m = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (!m) return null;
    try { return JSON.parse(m[0]) as T; } catch { return null; }
  }
}
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const fallback = (message?: string) => ({
    subject: "Other",
    title: (message || "New chat").slice(0, 40),
  });

  let message = "";
  try {
    ({ message } = (await req.json()) as { message: string });

    const raw = await callAI(
      [
        {
          role: "system",
          content: `Classify the student's chat message into one of these subjects (pick "Other" if none fits): ${SUBJECTS.join(", ")}. Also produce a short 2-5 word title. Return ONLY JSON: {"subject": string, "title": string}.`,
        },
        { role: "user", content: (message || "").slice(0, 500) },
      ],
      true,
    );

    const parsed = safeJson<{ subject?: string; title?: string }>(raw);
    return new Response(
      JSON.stringify({
        subject: SUBJECTS.includes(parsed?.subject ?? "") ? parsed!.subject : "Other",
        title: parsed?.title || (message || "New chat").slice(0, 40),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-classify error", e);
    // Classification is non-critical — degrade gracefully instead of failing the chat.
    return new Response(JSON.stringify(fallback(message)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
