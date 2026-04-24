import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Sparkles, Trash2, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/tutor")({
  component: () => (
    <RequireProfile>
      <Tutor />
    </RequireProfile>
  ),
});

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Explain photosynthesis step by step",
  "Help me solve: 2x + 5 = 17",
  "Quiz me on World War 2",
  "How do I write a strong essay intro?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function Tutor() {
  const { state } = useStore();
  const profile = state.profile!;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (textArg?: string) => {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: next,
          profile: {
            name: profile.name,
            grade: profile.grade,
            curriculum: profile.curriculum,
          },
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error("Too many requests — please wait a moment.");
        } else if (resp.status === 402) {
          toast.error("AI credits exhausted. Add credits in your workspace.");
        } else {
          toast.error("Tutor is unavailable right now.");
        }
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsert(delta);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send();
  };

  const clear = () => setMessages([]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" /> AI Tutor
          </h1>
          <p className="text-sm text-muted-foreground">
            Ask anything — I'll guide you step by step.
          </p>
        </div>
        {messages.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3 pb-4">
        {messages.length === 0 && (
          <Card className="border-dashed bg-muted/40 p-4">
            <p className="mb-3 text-sm font-medium">Try asking…</p>
            <div className="grid grid-cols-1 gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border bg-card p-3 text-left text-sm transition-all hover:border-primary hover:shadow-glow"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}

        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Bot className="h-4 w-4 animate-pulse" /> thinking…
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="fixed bottom-20 left-0 right-0 z-30 mx-auto max-w-md px-4"
      >
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-lg">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor…"
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || loading}
            className="h-9 w-9 shrink-0 bg-gradient-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
      {/* spacer so messages aren't hidden behind composer */}
      <div className="h-20" />
    </AppShell>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed animate-fade-in",
          isUser
            ? "bg-gradient-primary text-primary-foreground"
            : "bg-card border",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-pre:bg-muted prose-pre:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content || "…"}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
