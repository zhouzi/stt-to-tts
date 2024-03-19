import { useCallback, useMemo, useRef, useState } from "react";

class NoAudioError extends Error {
  constructor() {
    super(`Pas de lecteur audio, est-il bien injecté ?`);
  }
}

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | undefined>(undefined);
  const [status, setStatus] = useState<"inactive" | "playing">("inactive");

  const stop = useCallback(() => {
    if (audioRef.current == null) {
      throw new NoAudioError();
    }

    setStatus("inactive");
    audioRef.current.pause();

    // FIXME: dropping the MediaRecorder from memory might not be enough for garbage collection
    audioRef.current = undefined;
  }, []);

  const start = useCallback(
    (objectUrl: string) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = (audioRef.current = new Audio());

      audio.addEventListener("ended", () => {
        stop();
      });

      audio.src = objectUrl;
      audio.play();
      setStatus("playing");
    },
    [stop],
  );

  return useMemo(() => ({ status, start, stop }), [status, start, stop]);
}
