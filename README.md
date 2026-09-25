<div align="center">

# 🎵 Syncora

### *Your mood. Your music. Your story.*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Syncora-f59e0b?style=for-the-badge&labelColor=0d1117)](https://syncora-rho.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&labelColor=0d1117)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&labelColor=0d1117)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&labelColor=0d1117)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge&labelColor=0d1117)](LICENSE)

<br/>

**Syncora** is a mood-driven music discovery platform that curates soundtracks for your emotions.  
Select how you feel — *Happy, Energetic, Focused, Calm, Sad, or Melancholic* — and Syncora delivers  
the perfect playlist, tracks your emotional journey, and keeps your private thoughts encrypted.

<br/>

<img src="https://img.shields.io/badge/✨_Built_with_love_and_late--night_coding_sessions-f59e0b?style=flat-square&labelColor=0d1117" />

</div>

---

<br/>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎧 Mood-Based Music Discovery
Select your current mood and instantly get a curated feed of tracks powered by **Spotify** metadata and **iTunes** previews. Every mood has its own vibe — unique gradients, taglines, and search queries.

### 🎬 YouTube Integration
Full-length songs via embedded YouTube player. Watch music videos right inside Syncora without ever leaving the app.

### 🔊 Audio Visualizer
Real-time waveform visualizer in the player deck — powered by the **Web Audio API** for generative tracks and smooth CSS-driven animations for streamed content.

</td>
<td width="50%">

### 🔐 Encrypted Journal
Write private thoughts with **password-based encryption**. Your journal entries are encrypted client-side before they ever leave your browser. Only you can decrypt them.

### 📊 Mood Analytics Dashboard
Interactive charts, calendar heatmaps, streaks, and mood distribution breakdowns — all computed from your real listening data stored in MongoDB Atlas.

### 🎵 Custom Playlists
Create, manage, and curate personal playlists. Add tracks from Discover, Timeline, or Analytics — your music library, your way.

</td>
</tr>
</table>

<br/>

## 🎨 Mood Themes

Syncora adapts its entire UI — background ambience, gradients, accents, and music suggestions — based on the mood you choose:

| Mood | Color | Vibe | Default Search |
|:---:|:---:|:---|:---|
| 😄 **Happy** | 🟡 `#f59e0b` | *Turn up the joy and let every beat brighten your day.* | `happy pop summer hits` |
| ⚡ **Energetic** | 🔴 `#f43f5e` | *Power up your moment with beats that keep you moving.* | `workout edm electronic` |
| 🎯 **Focused** | 🟢 `#10b981` | *Clear the noise and find your rhythm, one beat at a time.* | `lofi focus study beats` |
| 🧘 **Calm** | 🔵 `#0ea5e9` | *Slow down, breathe deeply, and let the music take over.* | `ambient meditation relaxation` |
| 😢 **Sad** | 💙 `#3b82f6` | *Let the music sit with you through the quieter moments.* | `melancholy piano slow indie` |
| 💜 **Melancholic** | 🟣 `#a855f7` | *Drift through memories and lose yourself in every sound.* | `dream pop shoegaze nostalgia` |

<br/>

## 🏗️ Tech Stack

<div align="center">

| Layer | Technology |
|:---|:---|
| **Frontend** | React 18, Vite 5, TailwindCSS 3, React Router v6 |
| **UI Icons** | Lucide React |
| **Fonts** | Inter, Space Grotesk (Google Fonts) |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB Atlas (with JSON-file fallback) |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **Music APIs** | Spotify Web API + iTunes Search API |
| **Video** | YouTube IFrame API |
| **Encryption** | Client-side XOR cipher with sentinel verification |
| **Deployment** | Vercel (Frontend) + Render (Backend) |

</div>

<br/>

## 📁 Project Structure

```
Syncora/
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddToPlaylistModal.jsx    # Playlist track manager
│   │   │   ├── AtmosphericBackground.jsx # Canvas-based ambient bg
│   │   │   ├── CustomCharts.jsx          # Bar & Ring chart components
│   │   │   ├── EmbeddedLyrics.jsx        # Song lyrics display
│   │   │   ├── Header.jsx                # Top nav + search bar
│   │   │   ├── JournalDrawer.jsx         # Encrypted journal sidebar
│   │   │   ├── MiniVideoPlayer.jsx       # Compact video player
│   │   │   ├── PlayerDeck.jsx            # Full audio player controls
│   │   │   ├── Sidebar.jsx               # Navigation sidebar
│   │   │   └── VisualizerWaveform.jsx    # Audio waveform canvas
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx           # Auth state management
│   │   │   ├── MoodContext.jsx           # Mood state + theme
│   │   │   ├── PlayerContext.jsx         # Audio/YouTube player logic
│   │   │   └── UIContext.jsx             # UI state (modals, toasts)
│   │   ├── pages/
│   │   │   ├── Analytics.jsx             # Charts, heatmap, stats
│   │   │   ├── AuthPage.jsx              # Login/Register with cinema bg
│   │   │   ├── Discover.jsx              # Music discovery feed
│   │   │   ├── Playlists.jsx             # Playlist management
│   │   │   └── Timeline.jsx              # Mood logging + history
│   │   ├── hooks/                        # Custom React hooks
│   │   ├── utils/
│   │   │   ├── api.js                    # API client with JWT
│   │   │   ├── crypto.js                 # Client-side encryption
│   │   │   └── moods.js                  # Mood themes + helpers
│   │   ├── App.jsx                       # Root app with routing
│   │   ├── main.jsx                      # Entry point
│   │   └── index.css                     # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json                       # SPA rewrites for Vercel
│
├── backend/                     # Express REST API
│   ├── config/
│   │   └── db.js                         # MongoDB + JSON fallback
│   ├── middleware/
│   │   ├── auth.js                       # JWT verification
│   │   └── error.js                      # Global error handler
│   ├── models/
│   │   ├── User.js                       # User schema
│   │   ├── Mood.js                       # Mood log schema
│   │   ├── Note.js                       # Encrypted note schema
│   │   └── Playlist.js                   # Playlist + tracks schema
│   ├── routes/
│   │   ├── auth.js                       # Register, login, /me
│   │   ├── moods.js                      # CRUD mood logs
│   │   ├── music.js                      # Spotify + iTunes + YouTube
│   │   ├── notes.js                      # CRUD encrypted notes
│   │   └── playlists.js                  # CRUD playlists + tracks
│   ├── server.js                         # Express app entry
│   └── package.json
│
├── screenshots/                 # App screenshots
└── .gitignore
```

<br/>

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm**
- **MongoDB Atlas** account (or use the built-in JSON-file fallback)
- **Spotify Developer** credentials (Client ID + Secret)

### 1. Clone the Repository

```bash
git clone https://github.com/Utkarshb77/Syncora.git
cd Syncora
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/syncora
JWT_SECRET=your_super_secret_jwt_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
FRONTEND_URL=http://localhost:5173
```

> 💡 **Tip:** If you skip `MONGO_URI`, Syncora gracefully falls back to local JSON file storage — perfect for quick testing!

Start the backend:

```bash
npm run dev
```

### 3. Setup the Frontend

```bash
cd frontend
npm install
```

For local development (API proxy is pre-configured in `vite.config.js`):

```bash
npm run dev
```

The app will be live at **http://localhost:5173** 🎉

### 4. Production Build

```bash
cd frontend
npm run build
```

Set `VITE_API_URL` to your deployed backend URL (e.g., `https://your-api.onrender.com/api`).

<br/>

## 🔑 API Endpoints

| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `POST` | `/api/auth/register` | Create new account | ✗ |
| `POST` | `/api/auth/login` | Login & get JWT | ✗ |
| `GET` | `/api/auth/me` | Get current user | ✓ |
| `GET` | `/api/music/search?q=` | Search tracks (Spotify + iTunes) | ✗ |
| `GET` | `/api/music/suggestions?q=` | Quick search suggestions | ✗ |
| `GET` | `/api/music/youtube?title=&artist=` | Get YouTube video ID | ✗ |
| `GET` | `/api/moods` | List mood logs | ✓ |
| `POST` | `/api/moods` | Log a mood entry | ✓ |
| `GET` | `/api/notes` | List encrypted notes | ✓ |
| `POST` | `/api/notes` | Create encrypted note | ✓ |
| `DELETE` | `/api/notes/:id` | Delete a note | ✓ |
| `GET` | `/api/playlists` | List playlists | ✓ |
| `POST` | `/api/playlists` | Create playlist | ✓ |
| `PUT` | `/api/playlists/:id` | Update playlist | ✓ |
| `POST` | `/api/playlists/:id/tracks` | Add track to playlist | ✓ |
| `DELETE` | `/api/playlists/:id/tracks/:trackId` | Remove track | ✓ |
| `DELETE` | `/api/playlists/:id` | Delete playlist | ✓ |
| `GET` | `/api/health` | Health check | ✗ |

<br/>

## 🔒 Security

- **JWT Authentication** — Stateless token-based auth with Bearer tokens
- **Password Hashing** — bcryptjs for secure password storage
- **Client-Side Encryption** — Journal entries are encrypted in the browser before being sent to the server. The server never sees your plaintext thoughts
- **CORS Protection** — Configurable origin whitelist with logging for blocked requests
- **Environment Variables** — All secrets stored in `.env`, never committed to git

<br/>

## 🌐 Deployment

| Service | Purpose | Config |
|:---|:---|:---|
| **Vercel** | Frontend hosting | `vercel.json` for SPA routing rewrites |
| **Render** | Backend API hosting | Auto-deploys from GitHub |
| **MongoDB Atlas** | Cloud database | Free tier M0 cluster |

<br/>

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

<br/>

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br/>
<div align="center">

**Made with ❤️ by [Utkarsh](https://github.com/Utkarshb77)**

*If Syncora made you smile, consider giving it a ⭐*

<br/>

<img src="https://img.shields.io/badge/🎵_Feel_the_music._Live_the_mood.-0d1117?style=for-the-badge" />

</div>