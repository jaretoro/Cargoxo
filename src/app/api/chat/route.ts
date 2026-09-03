import { NextResponse } from "next/server";
import { openai, CHAT_MODEL, CARGOXO_SYSTEM_PROMPT } from "@/lib/openai";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
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
