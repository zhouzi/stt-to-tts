import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") ?? process.env.OPENAI_API_KEY;

  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return new Response(undefined, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });
  const json = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: audio,
  });

  return Response.json(json);
}
