import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import { describe, expect, it, vi } from "vitest";

function notesHandler() {
  let handler: ((request: Request) => Promise<Response>) | undefined;
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith("/auth/v1/user")) return Response.json({ id: "verified-test-user" });
    if (url === "https://api.groq.com/openai/v1/chat/completions") {
      return Response.json({ choices: [{ message: { content: "Processed personal note" } }] });
    }
    throw new Error("Unexpected integration request");
  });
  const source = readFileSync("supabase/functions/ai-notes/index.ts", "utf8");
  const { outputText } = transpileModule(source, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  });
  runInNewContext(outputText, {
    exports: {}, Request, Response, AbortSignal, console, fetch: fetchMock,
    Deno: {
      env: { get: (key: string) => ({ SUPABASE_URL: "https://test.invalid", SUPABASE_ANON_KEY: "test-publishable", GROQ_API_KEY: "test-only-key" })[key] },
      serve: (fn: (request: Request) => Promise<Response>) => { handler = fn; },
    },
  });
  if (!handler) throw new Error("Notes handler did not register");
  return { handler, fetchMock };
}

describe("pre-feature personal Notes AI contract", () => {
  for (const action of ["summarize", "simplify", "quiz", "exam"]) {
    it(`retains ${action} using Groq and the existing content response`, async () => {
      const { handler, fetchMock } = notesHandler();
      const response = await handler(new Request("https://test.invalid/ai-notes", {
        method: "POST", headers: { Authorization: "Bearer test-session", "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: "A whole is made of equal parts.", grade: "Grade 5", curriculum: "CBC" }),
      }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ content: "Processed personal note" });
      const [, options] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
      expect(JSON.parse(String(options.body)).model).toBe("openai/gpt-oss-120b");
    });
  }
  it("removes featured generation without contacting Groq", async () => {
    const { handler, fetchMock } = notesHandler();
    const response = await handler(new Request("https://test.invalid/ai-notes", {
      method: "POST", headers: { Authorization: "Bearer test-session", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", grade: "Grade 5", subject: "Mathematics", topic: "Fractions" }),
    }));
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("preserves caller verification instead of restoring public AI access", async () => {
    const { handler, fetchMock } = notesHandler();
    const response = await handler(new Request("https://test.invalid/ai-notes", {
      method: "POST", body: JSON.stringify({ action: "summarize", text: "Personal notes" }),
    }));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});