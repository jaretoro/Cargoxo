import { NextResponse } from "next/server";
import { openai, CHAT_MODEL, CARGOXO_SYSTEM_PROMPT } from "@/lib/openai";

type ChatMessage = { role: "user" | "assistant"; content: string };

// This endpoint is deliberately public — the widget lives on the marketing
// pages so prospective customers can ask questions before signing up. That
// means it can't be protected with auth(), and instead has to be protected
// from cost abuse: anyone on the internet can reach it, and every call
// spends OpenAI credit.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_MESSAGES = 20;
const MAX_TOTAL_CHARS = 4_000;
const MAX_RESPONSE_TOKENS = 500;

// In-memory, so it resets on restart and is per-instance only. Good enough
// for a single dev/self-hosted server; swap for Redis or a hosted rate
// limiter before running this on serverless or behind more than one node.
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 10_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }

  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { reply: "You're sending messages a bit fast — give it a moment and try again." },
      { status: 429 },
    );
  }

  let messages: ChatMessage[];
  try {
    ({ messages } = (await request.json()) as { messages: ChatMessage[] });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: "Too many messages in one request." }, { status: 400 });
  }
  if (!messages.every((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")) {
    return NextResponse.json({ error: "Malformed message in request." }, { status: 400 });
  }

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json({ error: "Conversation is too long — start a new chat." }, { status: 413 });
  }

  // Placeholder key ships in .env for the demo — fail soft with a helpful
  // message instead of a raw 401 from OpenAI so the widget is still usable
  // to look at before a real key is configured.
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-xxx") {
    return NextResponse.json({
      reply:
        "The chatbot isn't connected to OpenAI yet — add a real OPENAI_API_KEY to your .env file to enable live answers.",
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: MAX_RESPONSE_TOKENS, // bounds the cost of any single call
      messages: [
        { role: "system", content: CARGOXO_SYSTEM_PROMPT },
        ...messages.slice(-10), // keep the request small; short-term memory is enough for FAQ-style support
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't come up with a response.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { reply: "Something went wrong reaching the assistant. Please try again shortly." },
      { status: 200 }
    );
  }
}
