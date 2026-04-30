// AI classifier — detects the subject + a short title for a chat message.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Science", "Biology", "Chemistry", "Physics",
  "Geography", "History", "CRE", "Agriculture", "Home Science", "Pre-Technical Studies",
  "Business Studies", "Computer Studies", "Social Studies", "Other",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { message } = (await req.json()) as { message: string };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tool = {
      type: "function",
      function: {
        name: "classify",
        description: "Classify a student chat message",
        parameters: {
          type: "object",
          properties: {
            subject: { type: "string", enum: SUBJECTS },
            title: { type: "string", description: "Short 2-5 word chat title" },
          },
          required: ["subject", "title"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `Classify the student's first chat message into one of these subjects (pick "Other" if none fits): ${SUBJECTS.join(", ")}. Also produce a short 2-5 word title.` },
          { role: "user", content: (message || "").slice(0, 500) },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "classify" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("classify gateway error", resp.status, t);
      return new Response(JSON.stringify({ subject: "Other", title: (message || "New chat").slice(0, 40) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");
    return new Response(JSON.stringify({
      subject: args.subject || "Other",
      title: args.title || (message || "New chat").slice(0, 40),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-classify error", e);
    return new Response(JSON.stringify({ subject: "Other", title: "New chat" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
