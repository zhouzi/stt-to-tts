import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") ?? process.env.OPENAI_API_KEY;

  const body = await req.json();
  const content: string = body.content ?? "";

  if (!content) {
    return new Response(undefined, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  return openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: content,
  });
}
