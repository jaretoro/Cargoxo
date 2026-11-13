import { NextResponse } from "next/server";
import { openai, CHAT_MODEL, buildSystemPrompt } from "@/lib/openai";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

type ChatMessage = { role: "user" | "assistant"; content: string };

// This endpoint is deliberately public — the widget lives on the marketing
// pages so prospective customers can ask questions before signing up. That
// means it can't be protected with auth(), and instead has to be protected
// from cost abuse: anyone on the internet can reach it, and every call
// spends OpenAI credit.
// Limits are enforced by src/lib/rate-limit.ts, which keeps its counters in
// the database so they hold across restarts and every app instance.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
// Per-IP limits can be dodged by anyone with enough addresses, so the whole
// endpoint is also capped per day: a hard ceiling on OpenAI spend.
const DAY_MS = 24 * 60 * 60_000;
const DAILY_GLOBAL_LIMIT = Number(process.env.CHAT_DAILY_LIMIT) || 2_000;
const MAX_MESSAGES = 20;
const MAX_TOTAL_CHARS = 4_000;
const MAX_RESPONSE_TOKENS = 500;

const ASSISTANT_UNAVAILABLE = "Something went wrong reaching the assistant. Please try again shortly.";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  let limited: boolean;
  try {
    limited = await isRateLimited(`chat:ip:${ip}`, MAX_REQUESTS_PER_WINDOW, WINDOW_MS);
  } catch (error) {
    // If the limit can't be checked, refuse rather than spend OpenAI credit unmetered.
    console.error("Chat rate limit check failed:", error);
    return NextResponse.json({ reply: ASSISTANT_UNAVAILABLE }, { status: 503 });
  }

  if (limited) {
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

  // Counted only here, once a request is about to cost money, so malformed
  // or per-IP-limited requests don't eat into the day's budget.
  try {
    if (await isRateLimited("chat:global", DAILY_GLOBAL_LIMIT, DAY_MS)) {
      return NextResponse.json(
        { reply: "The assistant has reached its limit for today. Please try again tomorrow." },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error("Chat daily limit check failed:", error);
    return NextResponse.json({ reply: ASSISTANT_UNAVAILABLE }, { status: 503 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: MAX_RESPONSE_TOKENS, // bounds the cost of any single call
      messages: [
        { role: "system", content: await buildSystemPrompt() },
        ...messages.slice(-10), // keep the request small; short-term memory is enough for FAQ-style support
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't come up with a response.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { reply: ASSISTANT_UNAVAILABLE },
      { status: 200 }
    );
  }
}
