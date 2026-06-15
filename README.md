# 🎙️ SpeechFlow — Live Speech-to-Text Dashboard

A React web application featuring **Nhost authentication** and **Deepgram real-time speech-to-text transcription** via WebSockets.

## Demo Flow

```
Login Page → Sign Up / Sign In → Protected Dashboard → Click Start → Speak → See Live Transcript
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Authentication | [Nhost](https://nhost.io) (email/password auth) |
| Speech-to-Text | [Deepgram](https://deepgram.com) (WebSocket streaming, Nova-2 model) |
| Routing | React Router v7 |
| Styling | Vanilla CSS (dark theme) |

## Architecture

```
src/
├── App.jsx              # React Router setup (/ → Login, /dashboard → Dashboard)
├── nhost.js             # Nhost client initialization
├── index.css            # Global styles (dark theme)
├── main.jsx             # React entry point
└── pages/
    ├── Login.jsx        # Email/password authentication via Nhost
    └── Dashboard.jsx    # Protected page with Deepgram live transcription
```

## How It Works

### Authentication (Nhost)
- User signs up or logs in using `nhost.auth.signUpEmailPassword()` / `nhost.auth.signInEmailPassword()`
- On success, the session is stored in `localStorage` for persistence across page refreshes
- Dashboard checks for a valid session on load — redirects to login if not authenticated
- Logout clears the session and calls `nhost.auth.signOut()`

### Live Speech-to-Text (Deepgram)
1. Opens a **WebSocket** connection to `wss://api.deepgram.com/v1/listen`
2. Requests **microphone access** via `navigator.mediaDevices.getUserMedia()`
3. **MediaRecorder** captures audio chunks every 250ms
4. Each chunk is streamed to Deepgram through the WebSocket
5. Deepgram returns transcript JSON in real time
6. Transcript text is parsed and displayed on screen instantly

## Setup

### Prerequisites
- Node.js 18+
- [Nhost](https://nhost.io) account (free tier)
- [Deepgram](https://deepgram.com) account (free $200 credits)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/speech-app.git
cd speech-app
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_NHOST_SUBDOMAIN=your_nhost_subdomain
VITE_NHOST_REGION=your_nhost_region
VITE_DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Run

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| WebSocket over REST for Deepgram | Live audio streaming requires persistent bidirectional communication — REST would add latency with repeated requests |
| localStorage for session | Nhost SDK v3 uses a stateless client — session persistence is handled manually via localStorage |
| 250ms MediaRecorder interval | Balances real-time responsiveness with network efficiency |
| Route protection via useEffect | Checks session on component mount and redirects unauthorized users before rendering |

## License

MIT
