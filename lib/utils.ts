import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Message {
  id: string;
  role: "system" | "human" | "ai";
  content: string;
}

export function unformatMessage(message: Message): BaseMessage {
  if (message.role === "human") {
    return new HumanMessage({ content: message.content });
  }

  if (message.role === "system") {
    return new SystemMessage({ content: message.content });
  }

  if (message.role === "ai") {
    return new AIMessage({ content: message.content });
  }

  if (message.role === "function") {
    return new AIMessage({ content: message.content });
  }

  throw new Error(`Unable to unformat message with role: ${message.role}`);
}
