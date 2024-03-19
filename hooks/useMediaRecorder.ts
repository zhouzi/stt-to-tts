import { useCallback, useMemo, useRef, useState } from "react";

class NoMediaRecorderError extends Error {
  constructor() {
    super(`Pas de MediaStream, les permissions sont-elles bien accordées ?`);
  }
}

export function useMediaRecorder() {
  const mediaStreamRef = useRef<MediaStream | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);

  const [status, setStatus] = useState<RecordingState>("inactive");

  const stop = useCallback(() => {
    if (mediaRecorderRef.current == null) {
      throw new NoMediaRecorderError();
    }

    mediaRecorderRef.current.stop();
    setStatus(mediaRecorderRef.current.state);

    // FIXME: dropping the MediaRecorder from memory might not be enough for garbage collection
    mediaRecorderRef.current = undefined;
  }, []);

  const start = useCallback(
    (signal: AbortSignal): Promise<File> => {
      return new Promise(async (resolve, reject) => {
        if (mediaStreamRef.current == null) {
          try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
          } catch (err) {
            return reject(new NoMediaRecorderError());
          }
        }

        const mediaRecorder = (mediaRecorderRef.current = new MediaRecorder(
          mediaStreamRef.current,
        ));

        mediaRecorder.addEventListener("dataavailable", (event) => {
          chunksRef.current.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          if (chunksRef.current.length === 0) {
            return;
          }

          const blob = new Blob(chunksRef.current, {
            type: mediaRecorder.mimeType,
          });
          const file = new File([blob], "speech.mp3", {
            type: mediaRecorder.mimeType,
          });

          resolve(file);
        });

        signal.addEventListener("abort", () => {
          chunksRef.current = [];
          stop();
        });

        mediaRecorder.start();
        setStatus(mediaRecorder.state);
      });
    },
    [stop],
  );

  return useMemo(() => ({ start, stop, status }), [start, stop, status]);
}
