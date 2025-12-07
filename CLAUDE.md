# CLAUDE.md - StreamHub Pro Development Guide

> This file provides comprehensive context for Claude Code to understand and work with this codebase effectively.

## Project Overview

**StreamHub Pro** is a browser-based professional live streaming studio designed as a OneStream/OBS alternative. It enables content creators to broadcast to multiple destinations simultaneously (YouTube, Facebook, Twitch, Custom RTMP) while managing media assets, arranging dynamic layouts, and utilizing AI for stream optimization.

### Key Differentiator
The application runs primarily in the browser with a backend for RTMP transcoding - no complex desktop software required.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                         │
│              React 19 + Vite + Nginx (Port 8080)             │
│  Components: Studio, CanvasCompositor, DestinationManager    │
└─────────────────────────────────────────────────────────────┘
                              ↓ REST API + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                          │
│           Node.js + Express + Node-Media-Server              │
│  Ports: 3000 (API), 8080 (WS), 1935 (RTMP), 8000 (HLS)      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                              │
│            PostgreSQL (5432) + Redis (6379)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
streamhub-advanced/
├── components/                    # React UI Components
│   ├── Studio.tsx                # Main studio orchestrator (659 lines)
│   ├── CanvasCompositor.tsx      # HTML5 Canvas mixing engine (398 lines)
│   ├── DestinationManager.tsx    # RTMP destination configuration
│   ├── CloudVMManager.tsx        # Cloud provider integration UI
│   ├── LandingPage.tsx           # Authentication & landing page
│   ├── MediaBin.tsx              # Media asset management
│   ├── LayoutSelector.tsx        # Layout selection UI
│   ├── AudioMixer.tsx            # Audio mixing controls
│   ├── NotificationPanel.tsx     # Notification settings
│   ├── CloudImportModal.tsx      # Cloud import dialog
│   └── AuthModal.tsx             # Authentication modal
├── services/
│   └── geminiService.ts          # Google Gemini AI integration
├── backend/
│   └── package.json              # Backend dependencies (NO server.js yet!)
├── App.tsx                       # Main app routing
├── index.tsx                     # React DOM entry point
├── types.ts                      # TypeScript type definitions
├── Dockerfile                    # Frontend container (multi-stage)
├── Dockerfile.backend            # Backend container (generates server.js)
├── docker-compose.yml            # Multi-service orchestration
├── default.conf                  # Nginx configuration
├── init.sql                      # PostgreSQL schema initialization
├── vite.config.ts                # Vite build configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Frontend dependencies
└── index.html                    # HTML entry (Tailwind CDN)
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.2.0 | UI framework |
| **Build** | Vite | 6.2.0 | Fast bundler |
| **Language** | TypeScript | 5.8.2 | Type safety |
| **Styling** | Tailwind CSS | CDN | Utility-first CSS |
| **Icons** | Lucide React | 0.555.0 | Icon library |
| **Routing** | React Router DOM | 7.9.6 | Client routing |
| **AI** | @google/genai | 1.30.0 | Gemini integration |
| **Backend** | Express.js | 4.18.2 | REST API |
| **Streaming** | Node-Media-Server | 2.6.3 | RTMP server |
| **WebSocket** | ws | 8.14.2 | Real-time signaling |
| **Database** | PostgreSQL | 15 | Persistent storage |
| **Cache** | Redis | 7 | Session management |
| **Video** | FFmpeg | Alpine | Transcoding |
| **Containers** | Docker | Latest | Deployment |

---

## Key Components Explained

### Studio.tsx (Main Orchestrator)
- **Location:** `components/Studio.tsx`
- **Purpose:** Central hub managing all streaming functionality
- **Key State:**
  - `destinations[]` - RTMP endpoints configuration
  - `streamMode` - 'local' or 'cloud_vm'
  - `appState` - streaming/recording status
  - `mixerState` - audio volume levels
  - `mediaAssets[]` - uploaded media files
- **Key Functions:**
  - `startBroadcasting()` - Initiates stream (currently simulated)
  - `stopBroadcasting()` - Ends stream & downloads recording
  - `toggleCamera/Screen()` - Media device control
  - `handleGenerateMetadata()` - AI title/description generation

### CanvasCompositor.tsx (Video Mixing Engine)
- **Location:** `components/CanvasCompositor.tsx`
- **Purpose:** Real-time video compositing at 30fps
- **Layouts Supported:**
  - `FULL_CAM` - Full-screen camera
  - `FULL_SCREEN` - Full-screen content
  - `PIP` - Picture-in-picture (draggable)
  - `SPLIT` - Side-by-side
  - `NEWSROOM` - Professional shoulder view
- **Key Methods:**
  - `getStream()` - Returns `canvas.captureStream(30)`
  - `getVideoElement()` - Exposes video element for audio mixing
- **Critical:** Uses `requestAnimationFrame` for smooth rendering

### types.ts (Type Definitions)
- **Enums:** `Platform`, `LayoutMode`
- **Types:** `MediaType`, `StreamMode`, `UserPlan`, `CloudProvider`
- **Interfaces:** `Destination`, `MediaAsset`, `User`, `AppState`, `AudioMixerState`

---

## Common Development Commands

```bash
# Frontend Development
npm install                    # Install dependencies
npm run dev                    # Start Vite dev server (port 3000)
npm run build                  # Production build to dist/
npm run preview                # Preview production build

# Docker Development
docker-compose up --build      # Build and start all services
docker-compose up -d           # Start in background
docker-compose logs -f         # Stream all logs
docker-compose down            # Stop and remove containers

# Individual Services
docker-compose up frontend     # Start frontend only
docker-compose up backend      # Start backend only
docker-compose up postgres     # Start database only
```

---

## Environment Variables

```bash
# Frontend (via Vite)
VITE_GEMINI_API_KEY=<your-key>     # Google Gemini API key

# Backend (via docker-compose)
NODE_ENV=production
REDIS_HOST=redis
REDIS_PORT=6379
DATABASE_URL=postgresql://streamhub:streamhub@postgres:5432/streamhub
```

---

## Database Schema (PostgreSQL)

### Tables
1. **users** - User accounts (email, username, timestamps)
2. **stream_destinations** - RTMP endpoints per user
3. **stream_sessions** - Stream history with metadata
4. **media_assets** - Uploaded files (images, videos, audio)
5. **stream_analytics** - Viewer counts and metrics

### Key Relationships
- `stream_destinations.user_id` → `users.id`
- `stream_sessions.user_id` → `users.id`
- `media_assets.user_id` → `users.id`
- `stream_analytics.session_id` → `stream_sessions.id`

---

## Current Implementation Status

### Frontend: ~80% Complete
| Feature | Status | Notes |
|---------|--------|-------|
| Canvas Compositor | DONE | 5 layouts, 30fps rendering |
| Media Bin | DONE | Upload, import, toggle |
| Destination Manager | DONE | Add/remove/toggle RTMP |
| Audio Mixer | DONE | Web Audio API integration |
| AI Integration | DONE | Gemini title/hashtag generation |
| Plan-based Gating | DONE | Free/Pro/Business tiers |
| Local Recording | DONE | MediaRecorder API |
| Draggable PIP | DONE | Mouse/touch events |
| Mobile Responsive | DONE | Bottom tab navigation |
| Authentication | MOCK | Uses local state, no backend |

### Backend: ~25% Complete
| Feature | Status | Notes |
|---------|--------|-------|
| Express Health Check | DONE | /health endpoint |
| Node-Media-Server | DONE | RTMP/HLS config |
| WebSocket Server | PARTIAL | Basic setup only |
| Database Connection | NOT DONE | pg package installed, no code |
| Redis Integration | NOT DONE | redis package installed |
| WebRTC→RTMP Bridge | NOT DONE | Core functionality missing |
| Authentication | NOT DONE | No JWT/session handling |
| Multi-platform Push | NOT DONE | No FFmpeg relay logic |

### Infrastructure: ~70% Complete
| Feature | Status | Notes |
|---------|--------|-------|
| Docker Compose | DONE | 4-service setup |
| PostgreSQL Init | DONE | Schema + indexes |
| Nginx Config | DONE | Gzip, caching, security |
| GCP Deployment Docs | DONE | Cloud Run ready |
| CI/CD Pipeline | NOT DONE | No GitHub Actions |
| SSL/TLS | NOT DONE | No certificate config |

---

## Known Issues & Constraints

1. **Audio Sync Drift** - Canvas and HTML5 video can drift; AudioContext needs tight coupling
2. **CORS on Cloud Import** - External URLs taint the canvas; needs proxy or CORS headers
3. **Browser Performance** - Heavy video decoding causes lag on low-end hardware
4. **No Real Streaming** - Currently simulates RTMP connection; backend bridge required
5. **Backend Auto-generated** - `server.js` is created at Docker build time, not in source

---

## Critical Code Patterns

### Canvas Stream Capture
```typescript
// CanvasCompositor.tsx:127-136
getStream: () => {
  if (canvasRef.current) {
    return canvasRef.current.captureStream(30);
  }
  return new MediaStream();
}
```

### Audio Mixing with Web Audio API
```typescript
// Studio.tsx:119-148
const ctx = new AudioContext();
const dest = ctx.createMediaStreamDestination();
// Connect mic, music, video to destination node
source.connect(gain);
gain.connect(dest);
```

### Simulated Stream Connection
```typescript
// Studio.tsx:330-337
setTimeout(() => {
  setDestinations(prev =>
    prev.map(d => d.isEnabled ? ({ ...d, status: 'live' }) : d)
  );
}, 3000);
```

---

## When Adding Features

1. **New Layouts:** Edit `CanvasCompositor.tsx` draw loop and add to `LayoutMode` enum
2. **New Media Types:** Update `MediaType` in `types.ts`, handle in `MediaBin.tsx`
3. **New Destinations:** Extend `Platform` enum and `DestinationManager.tsx` presets
4. **Backend Endpoints:** Create actual `backend/server.js` file (currently auto-generated)
5. **Database Changes:** Update `init.sql` and restart postgres container

---

## Testing Approach

Currently no test infrastructure exists. Recommended setup:
- **Frontend:** Vitest + React Testing Library
- **Backend:** Jest + Supertest
- **E2E:** Playwright or Cypress

---

## Deployment

### Local (Docker Compose)
```bash
docker-compose up --build
# Access at http://localhost:8080
```

### GCP Cloud Run
See `GCP_DEPLOYMENT.md` for full guide:
1. Build and push images to Artifact Registry
2. Deploy backend to Cloud Run
3. Deploy frontend to Cloud Run
4. Configure Cloud SQL (PostgreSQL) and Memorystore (Redis)

---

## Priority Next Steps

1. **Create actual `backend/server.js`** - Replace auto-generated stub
2. **Implement WebRTC→RTMP bridge** - The core streaming functionality
3. **Add authentication** - JWT or session-based
4. **Connect database** - User persistence, destination storage
5. **FFmpeg relay logic** - Multi-platform RTMP push
