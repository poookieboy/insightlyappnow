const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
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
  ask: "Be conversational like ChatGPT. Answer clearly and naturally.",
  explain:
    "Explain step by step using numbered steps. Give a worked example and a short summary.",
  quiz:
    "Ask one question at a time, wait for the answer, mark it, explain it, and track the score.",
  diagram:
    "When useful, include a Mermaid diagram and briefly explain it.",
  project:
    "Help the student plan and build a school project step by step.",
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) return null;

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function convertMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => {
      const parts: Array<Record<string, unknown>> = [];

      if (message.content?.trim()) {
        parts.push({
          text: message.content,
        });
      }

      if (message.role === "user" && message.images?.length) {
        for (const image of message.images.slice(0, 4)) {
          const parsed = parseDataUrl(image);

          if (parsed) {
            parts.push({
              inlineData: {
                mimeType: parsed.mimeType,
                data: parsed.data,
              },
            });
          }
        }
      }

      return {
        role: message.role === "assistant" ? "model" : "user",
        parts,
      };
    })
    .filter((message) => message.parts.length > 0);
}

function extractGeminiText(data: any): string {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text ?? "")
      .join("") ?? ""
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({
          error: "Invalid messages.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const GEMINI_API_KEY =
      Deno.env.get("GEMINI_API_KEY") ||
      Deno.env.get("GOOGLE_API_KEY") ||
      Deno.env.get("GOOGLE_GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error("Gemini API key is missing.");

      return new Response(
        JSON.stringify({
          error: "AI service is not configured.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const profileLine = body.profile
      ? `The student is ${
          body.profile.name ?? "a student"
        }, in ${
          body.profile.grade ?? "an unspecified grade"
        }, following the ${
          body.profile.curriculum ?? "standard"
        } curriculum.`
      : "";

    const modeLine =
      body.mode && MODE_INSTRUCTIONS[body.mode]
        ? `MODE: ${body.mode.toUpperCase()} - ${
            MODE_INSTRUCTIONS[body.mode]
          }`
        : "";

    const projectLine = body.projectInstructions
      ? `PROJECT CONTEXT (${
          body.projectName ?? "Unnamed"
        }): ${body.projectInstructions}`
      : "";

    const systemPrompt = `
You are Iris, the friendly AI study companion inside Insightly.

Always call the app "Insightly" and yourself "Iris".

${profileLine}

${modeLine}

${projectLine}

Help students understand their school work clearly.

Rules:
- Keep explanations age-appropriate.
- Use short paragraphs and bullet points.
- Explain difficult concepts simply.
- For mathematics, show working line by line.
- Never use LaTeX.
- Use markdown when useful.
- Never invent facts.
- When an image is attached, inspect it and help the student understand it.
- When a student is stuck, guide them instead of simply dumping the answer.
`;

    const contents = convertMessages(body.messages);

    if (contents.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No messages provided.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    /*
     * IMPORTANT:
     * Use generateContent instead of streamGenerateContent.
     *
     * The Gemini diagnostic confirmed that this model is
     * available to the current API key.
     */
    const model = "gemini-2.5-flash";

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        GEMINI_API_KEY,
      )}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },

        contents,

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData: any = {};

      try {
        errorData = JSON.parse(responseText);
      } catch {
        // Ignore invalid JSON.
      }

      console.error(
        "Gemini API error:",
        JSON.stringify({
          status: response.status,
          apiStatus: errorData?.error?.status,
          message: errorData?.error?.message,
        }),
      );

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Iris is busy right now. Please try again shortly.",
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        return new Response(
          JSON.stringify({
            error:
              "The Gemini API key is invalid or not authorized.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          error: `Gemini AI service error (${response.status}).`,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid response from Gemini.",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const text = extractGeminiText(data);

    if (!text) {
      console.error(
        "Gemini returned no usable text.",
        JSON.stringify(data),
      );

      return new Response(
        JSON.stringify({
          error: "Gemini returned no answer.",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    /*
     * Keep the response compatible with the existing
     * Insightly frontend by returning an OpenAI-style
     * SSE response.
     */
    const streamBody =
      `data: ${JSON.stringify({
        choices: [
          {
            delta: {
              content: text,
            },
            index: 0,
          },
        ],
      })}\n\n` +
      `data: [DONE]\n\n`;

    return new Response(streamBody, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(
      "ai-tutor error:",
      error instanceof Error
        ? error.message
        : error,
    );

    return new Response(
      JSON.stringify({
        error: "Iris encountered a server error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
