import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/server/ai";
import { requireSessionUser } from "@/lib/server/session";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_MESSAGES = 30;
const MAX_LEN = 4000;

function sanitize(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (
      typeof m !== "object" ||
      m === null ||
      typeof (m as { role: unknown }).role !== "string" ||
      typeof (m as { content: unknown }).content !== "string"
    ) {
      continue;
    }
    const r = (m as { role: string }).role;
    // The server owns the system prompt — never let a client inject one.
    // Coerce anything other than assistant back to user.
    const role: ChatMessage["role"] = r === "assistant" ? "assistant" : "user";
    out.push({ role, content: (m as { content: string }).content.slice(0, MAX_LEN) });
  }
  return out.slice(-MAX_MESSAGES);
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    await requireSessionUser();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    messages?: unknown;
  };
  const messages = sanitize(body.messages);
  if (messages.length === 0) {
    return NextResponse.json({ error: "no_messages" }, { status: 400 });
  }
  try {
    const reply = await chat(messages);
    return NextResponse.json({ reply });
  } catch (err) {
    // Log the upstream detail server-side, but don't leak it (OpenAI error
    // bodies, model names, etc.) to the client.
    // eslint-disable-next-line no-console
    console.error("[ai/chat] request failed", err);
    return NextResponse.json({ error: "chat_failed" }, { status: 500 });
  }
}
