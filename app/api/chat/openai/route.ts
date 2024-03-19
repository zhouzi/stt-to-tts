import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { NextRequest } from "next/server";

import { Message, unformatMessage } from "@/lib/utils";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") ?? process.env.OPENAI_API_KEY;

  const body = await req.json();
  const messages: Message[] = body.messages ?? [];

  const input = messages[messages.length - 1]?.content;

  if (input == null) {
    return new Response(undefined, { status: 400 });
  }

  const pastMessages = messages.slice(0, -1).map(unformatMessage);

  const chatHistory = new ChatMessageHistory(pastMessages);
  const memory = new BufferMemory({ chatHistory });

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: "gpt-4",
    verbose: process.env.NODE_ENV === "development",
  });

  const chain = new ConversationChain({ llm, memory });
  const answer = await chain.call({ input });

  return new Response(answer.response);
}
