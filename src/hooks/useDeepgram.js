import { useState, useRef, useCallback, useEffect } from "react";

export default function useDeepgram() {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Click Start to begin speaking");
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const sessionTimeoutRef = useRef(null);

  // Maximum session duration (e.g., 5 minutes to prevent leaving mic on and draining credits)
  const MAX_SESSION_MS = 5 * 60 * 1000;

  const stopListening = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    setIsListening(false);
    setInterimTranscript(""); // Clear interim on stop
    setStatus("⏹ Stopped. Click Start to begin again.");
  }, []);

  const startListening = async () => {
    // Debounce/Prevent double start
    if (isListening || socketRef.current?.readyState === WebSocket.OPEN) return;
    
    setStatus("Connecting to Deepgram...");
    setError(null);
    setTranscript("");
    setInterimTranscript("");

    const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

    if (!DEEPGRAM_KEY) {
      setError("Missing Deepgram API Key. Check your .env file.");
      setStatus("❌ Configuration Error");
      return;
    }

    // Step 1: Open WebSocket
    const socket = new WebSocket(
      "wss://api.deepgram.com/v1/listen?language=en&model=nova-2&punctuate=true&interim_results=true",
      ["token", DEEPGRAM_KEY]
    );
    socketRef.current = socket;

    socket.onopen = async () => {
      setStatus("🟢 Listening... Speak now!");
      setIsListening(true);

      try {
        // Step 2: Get microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Step 3: MediaRecorder
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.addEventListener("dataavailable", (e) => {
          if (socket.readyState === WebSocket.OPEN && e.data.size > 0) {
            socket.send(e.data);
          }
        });

        recorder.start(250);

        // Prevent infinite sessions draining credits
        sessionTimeoutRef.current = setTimeout(() => {
          stopListening();
          setError("Session auto-stopped after 5 minutes to save credits.");
        }, MAX_SESSION_MS);

      } catch (err) {
        setStatus("❌ Microphone access denied.");
        setError("Please allow microphone permissions in your browser.");
        setIsListening(false);
        if (socket.readyState === WebSocket.OPEN) socket.close();
      }
    };

    // Step 4: Handle messages (Interim vs Final)
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const isFinal = data.is_final;
      const text = data.channel?.alternatives?.[0]?.transcript;

      if (text && text.trim() !== "") {
        if (isFinal) {
          // Commit to permanent transcript and clear interim
          setTranscript((prev) => prev + " " + text);
          setInterimTranscript("");
        } else {
          // Update just the interim text
          setInterimTranscript(text);
        }
      }
    };

    socket.onerror = (err) => {
      setStatus("❌ Connection error.");
      setError("Failed to connect to Deepgram. Check API key and network.");
      stopListening();
    };

    socket.onclose = () => {
      if (isListening) {
        stopListening();
      }
    };
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    transcript,
    interimTranscript,
    isListening,
    status,
    error,
    startListening,
    stopListening,
    clearTranscript
  };
}
