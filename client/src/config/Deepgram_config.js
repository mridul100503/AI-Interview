import { DeepgramClient } from "@deepgram/sdk";

const DEEPGRAM_API_KEY =
  import.meta.env.VITE_DEEPGRAM_API_KEY || import.meta.env.VITE_DEEPGRAM_API_ID;

const DEFAULT_LISTEN_OPTIONS = {
  model: "nova-3",
  language: "en-US",
  smart_format: true,
  interim_results: true,
  punctuate: true,
};

export const hasDeepgramApiKey = Boolean(DEEPGRAM_API_KEY);

export const createDeepgramMicTranscriber = ({
  onFinalTranscript,
  onInterimTranscript,
  onError,
  onClose,
} = {}) => {
  let socket = null;
  let mediaRecorder = null;
  let mediaStream = null;
  let keepAliveTimer = null;
  let isStarting = false;

  const cleanup = () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    mediaRecorder = null;

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    if (socket) {
      try {
        socket.sendFinalize({ type: "Finalize" });
        socket.sendCloseStream({ type: "CloseStream" });
      } catch {
        // Socket may already be closed.
      }

      try {
        socket.close();
      } catch {
        // Socket may already be closed.
      }
      socket = null;
    }
  };

  const handleMessage = (data) => {
    if (data?.type !== "Results") return;

    const transcript = data.channel?.alternatives?.[0]?.transcript?.trim();
    if (!transcript) return;

    if (data.is_final) {
      onInterimTranscript?.("");
      onFinalTranscript?.(transcript);
      return;
    }

    onInterimTranscript?.(transcript);
  };

  const start = async () => {
    if (!DEEPGRAM_API_KEY) {
      throw new Error("Deepgram API key is missing. Add VITE_DEEPGRAM_API_KEY in client/.env.");
    }

    if (isStarting || mediaRecorder?.state === "recording") return;

    isStarting = true;

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });
      socket = await deepgram.listen.v1.createConnection(DEFAULT_LISTEN_OPTIONS);

      socket.on("message", handleMessage);
      socket.on("error", (error) => {
        onError?.(error);
      });
      socket.on("close", (event) => {
        onClose?.(event);
      });

      socket.connect();
      await socket.waitForOpen();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket) {
          try {
            socket.sendMedia(event.data);
          } catch (error) {
            onError?.(error);
          }
        }
      };
      mediaRecorder.onerror = (event) => {
        onError?.(event.error);
      };

      mediaRecorder.start(250);

      keepAliveTimer = setInterval(() => {
        try {
          socket?.sendKeepAlive({ type: "KeepAlive" });
        } catch {
          // The recorder data will keep the stream alive while the mic is active.
        }
      }, 8000);
    } catch (error) {
      cleanup();
      onError?.(error);
      throw error;
    } finally {
      isStarting = false;
    }
  };

  return {
    start,
    stop: cleanup,
  };
};
