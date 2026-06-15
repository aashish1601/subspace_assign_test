import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import nhost from "../nhost";

export default function Dashboard() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Click Start to begin speaking");
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  // Route protection: redirect to login if no session stored
  useEffect(() => {
    const storedSession = localStorage.getItem("nhostSession");
    if (!storedSession) {
      navigate("/");
    }
  }, [navigate]);

  const startListening = async () => {
    setStatus("Connecting to Deepgram...");
    setTranscript("");

    const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

    // Step 1: Open WebSocket to Deepgram
    const socket = new WebSocket(
      "wss://api.deepgram.com/v1/listen?language=en&model=nova-2&punctuate=true",
      ["token", DEEPGRAM_KEY]
    );
    socketRef.current = socket;

    socket.onopen = async () => {
      setStatus("🟢 Listening... Speak now!");
      setIsListening(true);

      try {
        // Step 2: Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Step 3: Create MediaRecorder to capture audio chunks
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.addEventListener("dataavailable", (e) => {
          if (socket.readyState === WebSocket.OPEN && e.data.size > 0) {
            socket.send(e.data);
          }
        });

        // Start recording — emit a chunk every 250ms
        recorder.start(250);
      } catch (err) {
        setStatus("❌ Microphone access denied. Please allow microphone permission.");
        setIsListening(false);
      }
    };

    // Step 4: Receive transcript from Deepgram
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const text = data.channel?.alternatives?.[0]?.transcript;
      if (text && text.trim() !== "") {
        setTranscript((prev) => prev + " " + text);
      }
    };

    socket.onerror = () => {
      setStatus("❌ Connection error. Check your API key.");
      setIsListening(false);
    };

    socket.onclose = () => {
      setIsListening(false);
    };
  };

  const stopListening = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    setIsListening(false);
    setStatus("⏹ Stopped. Click Start to begin again.");
  };

  const handleLogout = async () => {
    try {
      await nhost.auth.signOut();
    } catch (e) {
      // ignore signOut errors
    }
    localStorage.removeItem("nhostSession");
    navigate("/");
  };

  // Get user email from stored session
  const storedSession = localStorage.getItem("nhostSession");
  let userEmail = "User";
  if (storedSession) {
    try {
      const session = JSON.parse(storedSession);
      userEmail = session?.user?.email || "User";
    } catch (e) {
      // ignore parse errors
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎙️ SpeechFlow</h1>
        </div>
        <div className="header-right">
          <span className="user-email">{userEmail}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="controls">
          <button
            className={`btn-mic ${isListening ? "listening" : ""}`}
            onClick={isListening ? stopListening : startListening}
            id="mic-button"
          >
            {isListening ? "⏹ Stop" : "🎤 Start Speaking"}
          </button>
          <p className="status-text">{status}</p>
        </div>

        <div className="transcript-box" id="transcript-box">
          <div className="transcript-header">
            <h3>Live Transcript</h3>
            <button 
              className="btn-copy" 
              onClick={() => {
                if (transcript) {
                  navigator.clipboard.writeText(transcript);
                  setStatus("✅ Copied to clipboard!");
                  setTimeout(() => setStatus("⏹ Stopped. Click Start to begin again."), 2000);
                }
              }}
              disabled={!transcript}
            >
              📋 Copy
            </button>
          </div>
          <div className="transcript-content" id="transcript-content">
            {transcript || "Your words will appear here in real time..."}
          </div>
        </div>
      </main>
    </div>
  );
}
