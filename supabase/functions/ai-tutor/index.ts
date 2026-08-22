const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  ask: "Be conversational like ChatGPT. Answer clearly, then offer a follow-up question.",
  explain:
    "Always answer with NUMBERED step-by-step explanations. Define terms, give a worked example, and end with a 1-line summary.",
  quiz:
    "Quiz the student. Ask ONE question at a time, wait for their answer, then mark it (✅/❌) and explain. Track score across the chat.",
  diagram:
    "ALWAYS include a Mermaid diagram (flowchart, sequence, or pie chart) inside a ```mermaid code block, then explain it briefly underneath.",
  project:
    "Help the student plan and build a school project. Suggest a structure (intro, materials, method, results, conclusion), then guide step by step.",
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

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

      if (message.content) {
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
    });
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
    const {
      messages,
      profile,
      mode,
      projectInstructions,
      projectName,
    } = (await req.json()) as RequestBody;

    if (!messages || !Array.isArray(messages)) {
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");

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

    const profileLine = profile
      ? `The student is ${profile.name ?? "a student"}, in ${
          profile.grade ?? "an unspecified grade"
        } following the ${
          profile.curriculum ?? "standard"
        } curriculum.`
      : "";

    const modeLine =
      mode && MODE_INSTRUCTIONS[mode]
        ? `\nMODE: ${mode.toUpperCase()} — ${MODE_INSTRUCTIONS[mode]}`
        : "";

    const projectLine = projectInstructions
      ? `\nPROJECT CONTEXT (${
          projectName ?? "Unnamed"
        }): ${projectInstructions}\nFollow the project instructions above in every reply in this conversation.`
      : "";

    const systemPrompt = `You are Iris — the friendly AI study companion inside Insightly (the all-in-one student app).

Always refer to the app as "Insightly" and to yourself as "Iris".
Never say "Student Sync" or "StudentSync".

${profileLine}${modeLine}${projectLine}

How you help:
- Answer academic questions clearly.
- For procedural topics such as mathematics, science problems, and essay structure, explain STEP BY STEP using numbered steps.
- Use short paragraphs and bullet points.
- Keep language age-appropriate.
- For maths, show working line by line.
- For concepts, give a definition and a quick example.
- If the student seems stuck, ask one guiding question instead of giving the full answer outright.
- Use markdown headings, bold text, lists, and code blocks when useful.

DIAGRAMS:
When a visual would help, such as cycles, processes, structures, flows, or comparisons, include a Mermaid diagram inside a fenced code block tagged mermaid.

MATHS FORMATTING:
Never use LaTeX.
Do not output $, $$, \\\\(, \\\\), \\\\[, \\\\], \\\\frac, \\\\sqrt or other LaTeX commands.
Write maths as plain readable text, for example:
2x + 5 = 17
x = 6
(a + b)/2
√25 = 5
x²
3 × 4

Show each step of mathematical working on its own line.

- Never invent facts. If unsure, say so and suggest where to look.
- When the student attaches an image, such as homework, a diagram, or handwritten work, inspect it carefully and help with it step by step.
- Be encouraging and celebrate effort naturally without excessive emoji.`;

    const contents = convertMessages(messages);

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
     * Google Gemini streaming endpoint.
     *
     * The API key stays server-side in Supabase.
     */
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `gemini-2.5-flash:streamGenerateContent?alt=sse&key=${encodeURIComponent(
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

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Gemini API error:",
        response.status,
        errorText,
      );

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "AI rate limit reached. Please try again shortly.",
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

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({
            error: "The Gemini API key is invalid or not authorized.",
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
          error: "Gemini AI service error.",
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

    if (!response.body) {
      throw new Error("Gemini returned an empty response.");
    }

    /*
     * Gemini returns SSE chunks containing Gemini response objects.
     *
     * The Insightly frontend already expects OpenAI-style streaming chunks,
     * so we translate Gemini's chunks into that format here.
     */
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { value, done } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, {
              stream: true,
            });

            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const event of events) {
              const dataLine = event
                .split("\n")
                .find((line) => line.startsWith("data:"));

              if (!dataLine) {
                continue;
              }

              const jsonText = dataLine
                .replace(/^data:\s*/, "")
                .trim();

              if (!jsonText || jsonText === "[DONE]") {
                continue;
              }

              try {
                const geminiData = JSON.parse(jsonText);
                const text = extractGeminiText(geminiData);

                if (!text) {
                  continue;
                }

                const openAiChunk = {
                  choices: [
                    {
                      delta: {
                        content: text,
                      },
                    },
                  ],
                };

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify(openAiChunk)}\n\n`,
                  ),
                );
              } catch (parseError) {
                console.error(
                  "Could not parse Gemini stream chunk:",
                  parseError,
                );
              }
            }
          }

          controller.enqueue(
            encoder.encode("data: [DONE]\n\n"),
          );

          controller.close();
        } catch (error) {
          console.error(
            "Gemini streaming error:",
            error,
          );

          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("ai-tutor error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unknown AI error.",
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
