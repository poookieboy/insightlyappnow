import { describe, expect, it } from "vitest";
import { readChatStream } from "./chat-stream";

function stream(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({ start(controller) {
    chunks.forEach((chunk) => controller.enqueue(chunk)); controller.close();
  } });
}
describe("Iris reply streaming", () => {
  it("reads an unterminated final response event", async () => {
    let text = "";
    await readChatStream(stream([new TextEncoder().encode('data:{"choices":[{"delta":{"content":"Four"}}]}')]), (part) => { text += part; });
    expect(text).toBe("Four");
  });
  it("preserves UTF-8 across byte chunks and stops at DONE", async () => {
    const bytes = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Café"}}]}\r\n\r\ndata: [DONE]\n');
    let text = "";
    await readChatStream(stream([...bytes].map((b) => new Uint8Array([b]))), (part) => { text += part; });
    expect(text).toBe("Café");
  });
  it("rejects malformed completed events rather than hanging", async () => {
    await expect(readChatStream(stream([new TextEncoder().encode('data: not-json\n')]), () => {})).rejects.toThrow();
  });
});