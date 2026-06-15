import { useNavigate } from "react-router-dom";
import nhost from "../lib/nhost";
import useDeepgram from "../hooks/useDeepgram";
import TranscriptBox from "../components/TranscriptBox";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    transcript,
    interimTranscript,
    isListening,
    status,
    error,
    startListening,
    stopListening,
    clearTranscript
  } = useDeepgram();

  const handleLogout = async () => {
    try {
      await nhost.auth.signOut();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("nhostSession");
    navigate("/");
  };

  const storedSession = localStorage.getItem("nhostSession");
  let userEmail = "User";
  if (storedSession) {
    try {
      userEmail = JSON.parse(storedSession)?.user?.email || "User";
    } catch (e) {
      // ignore
    }
  }

  const wordCount = (transcript + " " + interimTranscript)
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎙️ SpeechFlow</h1>
          <span className={`status-badge ${isListening ? "active" : ""}`}>
            {isListening ? "Live" : "Offline"}
          </span>
        </div>
        <div className="header-right">
          <span className="user-email">{userEmail}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && (
          <div className="alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="controls-card">
          <button
            className={`btn-mic ${isListening ? "listening" : ""}`}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? (
              <>
                <span className="spinner"></span> ⏹ Stop Recording
              </>
            ) : (
              "🎤 Start Speaking"
            )}
          </button>
          <p className="status-text">{status}</p>
        </div>

        <TranscriptBox 
          transcript={transcript} 
          interimTranscript={interimTranscript}
          wordCount={wordCount}
          onClear={clearTranscript}
        />
      </main>
    </div>
  );
}
