/** Read OpenAI-compatible SSE without losing a final event or split UTF-8 text. */
export async function readChatStream(body: ReadableStream<Uint8Array>, onText: (text: string) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let ended = false;
  const processLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload) return;
    if (payload === "[DONE]") { ended = true; return; }
    const result = JSON.parse(payload) as { error?: { message?: string }; choices?: { delta?: { content?: string } }[] };
    if (result.error) throw new Error(result.error.message || "Iris could not complete the reply.");
    const text = result.choices?.[0]?.delta?.content;
    if (typeof text === "string") onText(text);
  };
  try {
    while (!ended) {
      const next = await reader.read();
      buffer += next.done ? decoder.decode() : decoder.decode(next.value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1 && !ended) {
        processLine(buffer.slice(0, newline).replace(/\r$/, ""));
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");
      }
      if (next.done) {
        if (!ended && buffer.trim()) processLine(buffer.replace(/\r$/, ""));
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}