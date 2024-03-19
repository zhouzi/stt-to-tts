"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Github, LoaderCircle, Mic } from "lucide-react";
import { customAlphabet } from "nanoid/non-secure";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAudio } from "@/hooks/useAudio";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { Message } from "@/lib/utils";

export const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7,
);

const formSchema = z.object({
  openaiApiKey: z.string().optional(),
});

export default function Home() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const formRef = useRef(form);

  const [messages, setMessages] = useState<Message[]>([]);

  const [abortController] = useState(new AbortController());
  const mediaRecorder = useMediaRecorder();

  const audio = useAudio();
  const audioRef = useRef(audio);

  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    formRef.current = form;
  }, [form]);

  useLayoutEffect(() => {
    audioRef.current = audio;
  }, [audio]);

  useEffect(() => {
    return () => abortController.abort();
  }, [abortController]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage == null) {
      return;
    }

    if (lastMessage.role === "human") {
      const abortContoller = new AbortController();

      const headers = new Headers();

      const openApiKey = formRef.current.getValues("openaiApiKey");
      if (openApiKey) {
        headers.set("x-api-key", openApiKey);
      }

      fetch("/api/chat/openai", {
        method: "POST",
        body: JSON.stringify({ messages }),
        headers,
        signal: abortContoller.signal,
      }).then((res) => {
        if (res.ok) {
          return res.text().then((answer) => {
            setMessages((currentMessages) =>
              currentMessages.concat({
                id: nanoid(),
                role: "ai",
                content: answer,
              }),
            );
          });
        }
      });
      return () => abortContoller.abort();
    }

    if (lastMessage.role === "ai") {
      const abortContoller = new AbortController();

      const headers = new Headers();

      const openApiKey = formRef.current.getValues("openaiApiKey");
      if (openApiKey) {
        headers.set("x-api-key", openApiKey);
      }

      fetch("/api/tts/openai", {
        method: "POST",
        body: JSON.stringify({ content: lastMessage.content }),
        headers,
        signal: abortContoller.signal,
      }).then((res) => {
        if (res.ok) {
          return res.arrayBuffer().then((arrayBuffer) => {
            const audioBlob = new Blob([arrayBuffer], { type: "audio/mpeg" });
            const objectUrl = URL.createObjectURL(audioBlob);

            audioRef.current.start(objectUrl);
            setLoading(false);
          });
        }
      });

      return () => abortContoller.abort();
    }
  }, [messages]);

  return (
    <div className="container h-full">
      <header className="py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Playground</h2>
        <div className="flex gap-2">
          <Button variant="link" asChild>
            <a href="https://gabin.app">@gabinaureche</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="https://github.com/zhouzi/stt-to-tts">
              <Github className="mr-2 size-4" />
              GitHub
            </a>
          </Button>
        </div>
      </header>
      <Separator />
      <main className="grid h-full items-stretch gap-6 grid-cols-[1fr_400px] py-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            {mediaRecorder.status === "inactive" ? (
              <Button
                size="icon"
                disabled={audio.status === "playing" || loading}
                onClick={async () => {
                  const file = await mediaRecorder.start(
                    abortController.signal,
                  );

                  const formData = new FormData();
                  formData.append("audio", file);

                  const headers = new Headers();

                  const openApiKey = form.getValues("openaiApiKey");
                  if (openApiKey) {
                    headers.set("x-api-key", openApiKey);
                  }

                  setLoading(true);

                  const res = await fetch("/api/stt/openai", {
                    method: "POST",
                    body: formData,
                    headers,
                  });

                  if (!res.ok) {
                    throw new Error(res.statusText);
                  }

                  const json = (await res.json()) as { text: string };

                  setMessages((currentMessages) =>
                    currentMessages.concat({
                      id: nanoid(),
                      role: "human",
                      content: json.text,
                    }),
                  );
                }}
              >
                {loading ? <LoaderCircle className="animate-spin" /> : <Mic />}
              </Button>
            ) : (
              <Button
                size="icon"
                variant="secondary"
                onClick={() => mediaRecorder.stop()}
              >
                <Mic className="animate-pulse text-red-600" />
              </Button>
            )}
          </div>

          <div className="flex-1">
            <ul className="list-disc pl-4 whitespace-break-spaces space-y-2">
              {messages
                .slice()
                .reverse()
                .map((message) => (
                  <li key={message.id}>
                    <strong className="font-bold">{message.role}</strong>:{" "}
                    {message.content}
                  </li>
                ))}
            </ul>
          </div>
        </div>
        <div>
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="openaiApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clé API OpenAI</FormLabel>
                    <FormControl>
                      <Input placeholder="sk-123456789" {...field} />
                    </FormControl>
                    <FormDescription>
                      La clé API OpenAI est requise pour utiliser le
                      speech-to-text et le text-to-speech de OpenAI.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
