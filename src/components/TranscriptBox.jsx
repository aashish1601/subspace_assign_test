import { useState } from "react";

export default function TranscriptBox({ transcript, interimTranscript, wordCount, onClear }) {
  const [copyStatus, setCopyStatus] = useState("📋 Copy");

  const handleCopy = () => {
    const fullText = (transcript + " " + interimTranscript).trim();
    if (fullText) {
      navigator.clipboard.writeText(fullText);
      setCopyStatus("✅ Copied!");
      setTimeout(() => setCopyStatus("📋 Copy"), 2000);
    }
  };

  return (
    <div className="transcript-box" id="transcript-box">
      <div className="transcript-header">
        <div className="header-stats">
          <h3>Live Transcript</h3>
          <span className="word-count badge">{wordCount} words</span>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-text btn-clear" 
            onClick={onClear}
            disabled={!transcript && !interimTranscript}
          >
            Clear
          </button>
          <button 
            className="btn-copy" 
            onClick={handleCopy}
            disabled={!transcript && !interimTranscript}
          >
            {copyStatus}
          </button>
        </div>
      </div>
      
      <div className="transcript-content" id="transcript-content">
        {!transcript && !interimTranscript ? (
          <span className="placeholder-text">Your words will appear here in real time...</span>
        ) : (
          <>
            <span>{transcript}</span>
            {interimTranscript && (
              <span className="interim-text"> {interimTranscript}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
