import { useState } from "react";
import { useNavigate } from "react-router-dom";
import nhost from "../nhost";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (isSignup) {
        result = await nhost.auth.signUpEmailPassword({ email, password });
      } else {
        result = await nhost.auth.signInEmailPassword({ email, password });
      }

      // The new Nhost SDK returns { session, error } or throws
      if (result.error) {
        setError(result.error.message || "Authentication failed. Please try again.");
      } else {
        // Store the session in localStorage for persistence
        if (result.session) {
          localStorage.setItem("nhostSession", JSON.stringify(result.session));
        }
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎙️ SpeechFlow</h1>
          <p>Live Speech-to-Text Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button
              className="btn-link"
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
