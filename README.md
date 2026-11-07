# 🌊 WaveFlow — AI DJ Set & Energy Curve Generator

**WaveFlow** is a Spotify clone application that transforms your 200 recent "Liked Songs" into an emotional, continuous **50-track DJ set** calibrated across a 6-phase energy curve using Google's Gemini AI.

---

## ⚡ Key Features

- **Spotify 3-Pane Interface:** Authentic Spotify dark theme (`#121212`, `bg-black`, `bg-zinc-900`, `bg-zinc-950`) with Spotify Green accent (`#1DB954`).
- **OAuth 2.0 PKCE Flow:** Secure client-side authorization without exposing client secrets (`user-library-read playlist-modify-private`).
- **200 Track Liked Library Fetcher:** Pulls your 200 most recent saved tracks from Spotify via paginated API calls.
- **Gemini AI Acoustic Energy Scoring:** Formats "Track - Artist" lists and prompts Gemini to evaluate musical energy (`0-100`) and emotional valence (`0-100`) based on tempo, rhythm, intensity, and genre.
- **Markdown Stripping Utility:** Strips markdown code fences (```json ... ```) and safely extracts raw JSON arrays.
- **6-Phase DJ Set Progression Algorithm:** Sorts 50 unique tracks into an intentional DJ curve:
  1. **Phase 1: Warm-up** (Tracks 1–10) → Energy 40–60 (Ascending groove)
  2. **Phase 2: Build-up** (Tracks 11–20) → Energy 61–80 (Rhythmic acceleration)
  3. **Phase 3: Peak** (Tracks 21–25) → Energy 81–100 (High-voltage crescendo)
  4. **Phase 4: Valley/Respiro** (Tracks 26–32) → Energy 30–50 (Atmospheric breakdown)
  5. **Phase 5: Climax** (Tracks 33–45) → Energy 81–100 (Maximum emotional peak)
  6. **Phase 6: Outro** (Tracks 46–50) → Energy 40–60 (Harmonious cool-down)
- **Interactive SVG Energy Curve:** Custom spline chart showing energy elevation, phase separators, data points, and interactive track hover tooltips.
- **Direct Spotify Playlist Export:** Creates a private playlist and injects the 50 ordered URIs into your Spotify account with celebratory confetti.
- **Robust Mock / Preview Mode:** Full preview capabilities out of the box with 200 realistic electronic tracks even if API credentials are not provided.

---

## 🛠 Tech Stack

- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS (Dark theme: `bg-black`, `bg-zinc-900`, `bg-zinc-950`, accent `#1DB954`)
- **State Management:** `zustand`
- **Icons:** `lucide-react`
- **Celebration Effects:** `canvas-confetti`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate the values:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note:** If `.env` is omitted, you can enter credentials directly in the in-app **API Settings** modal or use the built-in **Demo / Instant Preview Mode**!

### 3. Setup Spotify Developer App
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Create an App.
3. In App Settings, add Redirect URI:
   ```
   http://localhost:5173/callback
   ```
4. Copy your **Client ID** into `.env` or the in-app Settings.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Architecture

```
src/
├── algorithm/
│   └── curveGenerator.ts    # 6-phase DJ curve algorithm (warm-up, build, peak, valley, climax, outro)
├── api/
│   ├── gemini.ts            # Gemini AI acoustics prompt, markdown stripping & JSON parser
│   ├── mockData.ts          # 200 realistic liked tracks & album artwork for instant preview
│   └── spotify.ts           # Spotify OAuth 2.0 PKCE, library fetch & playlist export
├── components/
│   ├── AuthModal.tsx        # Centered Spotify login & Demo mode trigger
│   ├── BottomBar.tsx        # Player replacement: track preview, generation status, Export button
│   ├── EnergyCurveChart.tsx # Interactive SVG dynamic curve chart with 6 phases & tooltips
│   ├── MainView.tsx         # Top gradient, hero generation trigger, metrics, tracklist table
│   ├── SettingsModal.tsx    # Live configuration of Spotify Client ID & Gemini API Key
│   ├── Sidebar.tsx          # 3-pane left sidebar: navigation, flow phases, user profile
│   └── TracklistTable.tsx   # Spotify tracklist (#, Title, Album, Energy badge, Mood, Duration)
├── store/
│   └── useWaveFlowStore.ts  # Zustand store managing auth, tracks, flow state, export status
├── types/
│   └── index.ts             # TypeScript definitions
├── utils/
│   ├── formatters.ts        # Duration (m:ss), energy & phase badge colors
│   └── pkce.ts              # Crypto SHA-256 base64url PKCE helpers
├── App.tsx                  # Root 3-pane layout, callback handler & modals
├── index.css                # Tailwind dark base styles & custom scrollbars
├── main.tsx                 # React DOM root
└── vite-env.d.ts            # Vite client environment types
```

---

## 🎛 The 6-Phase DJ Curve

| Phase | Tracks | Energy Range | Narrative Function |
|---|---|---|---|
| **Phase 1: Warm-up** | 1 – 10 | 40% – 60% | Sets the groove, establishes rhythm without listener exhaustion |
| **Phase 2: Build-up** | 11 – 20 | 61% – 80% | Accelerates tempo and introduces driving percussive elements |
| **Phase 3: Peak** | 21 – 25 | 81% – 100% | High-voltage explosion; early crescendo for the room |
| **Phase 4: Valley/Respiro** | 26 – 32 | 30% – 50% | Atmospheric breakdown; psychological breathing room before the finale |
| **Phase 5: Climax** | 33 – 45 | 81% – 100% | The defining, sustained emotional and acoustic peak of the night |
| **Phase 6: Outro** | 46 – 50 | 40% – 60% | Harmonious deceleration and smooth cool-down |

---

## 🌐 Netlify Deployment

WaveFlow is pre-configured for one-click Netlify deployment:
1. `netlify.toml` in the repository root defines:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   ```
2. `public/_redirects` ensures SPA client-side routing and `/callback` handling:
   ```
   /* /index.html 200
   ```
3. Set your production environment variables in Netlify Site Settings > Environment Variables:
   - `VITE_SPOTIFY_CLIENT_ID`
   - `VITE_GEMINI_API_KEY`
4. Add your Netlify production domain to your Spotify Developer Dashboard under **Redirect URIs**:
   `https://<your-app>.netlify.app/callback`
