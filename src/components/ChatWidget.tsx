"use client";

import { useState, useRef, useEffect, useId } from "react";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content: "Hi! I'm the Cargoxo assistant. Ask me how the marketplace works, how verification works, or about pricing.",
};

// The server caps a conversation at 4,000 characters in total; stopping a
// single message well short of that keeps a long one from being the thing
// that trips the limit.
const MAX_MESSAGE_LENGTH = 800;

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h16v11H8l-4 4z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  // Opening a chat panel and having to click again to type is a small thing
  // that gets noticed every single time.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      // The route answers rate limits and validation failures with `reply`
      // too, so those surface as a normal message rather than silence.
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? data.error ?? "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Cargoxo assistant"
          className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between bg-brand-navy px-4 py-3 text-white">
            <span className="font-semibold">Cargoxo Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/80 hover:text-white">
              <CloseIcon />
            </button>
          </div>

          {/* role="log" so a screen reader announces replies as they arrive
              instead of the panel going silent. */}
          <div ref={scrollRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto bg-brand-blue text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="w-fit rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">Typing…</div>}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-black/10 p-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-label="Your question"
              placeholder="Ask a question…"
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-md bg-brand-blue px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        aria-controls={panelId}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg hover:bg-brand-navy"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  );
}
