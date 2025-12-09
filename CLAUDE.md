# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
│   ├── geminiService.ts          # Google Gemini AI integration
│   └── apiClient.ts              # Backend API client with health checks
├── backend/
│   ├── server.js                 # Express + RTMP + WebSocket server (499 lines)
│   ├── package.json              # Backend dependencies
│   └── init-db.js                # Database initialization script
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

### Frontend Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start Vite dev server (default port 5173)
npm run build                  # Production build to dist/
npm run preview                # Preview production build
```

### Backend Development
```bash
cd backend
npm install                    # Install backend dependencies
npm run dev                    # Start with nodemon (auto-reload)
npm start                      # Start production server
npm run init-db                # Run database initialization script
```

### Docker Development
```bash
docker-compose up --build      # Build and start all services
docker-compose up -d           # Start in background
docker-compose logs -f         # Stream all logs
docker-compose logs -f backend # Stream backend logs only
docker-compose down            # Stop and remove containers
docker-compose down -v         # Stop and remove volumes (clears database)

# Individual Services
docker-compose up frontend     # Start frontend only
docker-compose up backend      # Start backend only
docker-compose up postgres     # Start database only
docker-compose restart backend # Restart backend after code changes
```

### Common Development Workflows

#### Starting Fresh
```bash
docker-compose down -v                    # Clear everything
docker-compose up --build -d postgres     # Start database first
docker-compose up --build backend         # Build and start backend
# In another terminal:
curl -X POST http://localhost:3000/api/init-database
docker-compose up frontend                # Start frontend
```

#### Backend Development Cycle
```bash
# Edit backend/server.js
docker-compose restart backend            # Restart to apply changes
docker-compose logs -f backend            # Watch logs
```

#### Frontend Development Cycle
```bash
npm run dev                               # Use Vite dev server (hot reload)
# Access at http://localhost:5173
# Changes auto-reload in browser
```

---

## Environment Variables

### Frontend (.env or docker-compose)
```bash
VITE_GEMINI_API_KEY=your-gemini-api-key    # Google Gemini API for metadata generation
VITE_BACKEND_URL=http://localhost:3000     # Backend API base URL (dev mode)
```

### Backend (docker-compose.yml or Cloud Run)
```bash
# Server Configuration
PORT=3000                                   # Express server port
NODE_ENV=production                         # Environment (development/production)
ENABLE_RTMP=true                            # Enable RTMP server (default: false for Cloud Run)

# Database (Local)
DATABASE_URL=postgresql://streamhub:streamhub@postgres:5432/streamhub

# Database (Cloud SQL)
INSTANCE_CONNECTION_NAME=project:region:instance
DB_USER=streamhub
DB_PASS=your-secure-password
DB_NAME=streamhub

# Redis
REDIS_HOST=redis                            # Redis hostname (use 'redis' in Docker)
REDIS_PORT=6379                             # Redis port
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

### Backend: ~65% Complete
| Feature | Status | Notes |
|---------|--------|-------|
| Express Health Check | DONE | /health endpoint |
| Node-Media-Server | DONE | RTMP/HLS config on port 1935/8000 |
| WebSocket Server | DONE | Real-time signaling implemented |
| Database Connection | DONE | PostgreSQL with Cloud SQL support |
| Redis Integration | DONE | Session cache client configured |
| CRUD API Endpoints | DONE | Users, destinations, sessions, analytics |
| Database Initialization | DONE | POST /api/init-database endpoint |
| WebRTC→RTMP Bridge | NOT DONE | Core functionality missing |
| Authentication | PARTIAL | No JWT/session handling yet |
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
4. **No Real Streaming** - Frontend simulates RTMP connection; WebRTC→RTMP bridge required
5. **RTMP Disabled by Default** - Backend requires `ENABLE_RTMP=true` env var for Cloud Run compatibility

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

## Key Architectural Decisions

### Why Canvas-Based Compositing?
The HTML5 Canvas approach allows:
- **Real-time mixing** of multiple video sources at 30fps without backend processing
- **Zero-latency preview** - what you see is exactly what streams
- **Browser-native** - no plugins or desktop software required
- **Flexible layouts** - drag-and-drop PIP positioning with pixel-perfect control

Trade-off: Canvas can be CPU-intensive on low-end devices; consider WebGPU in future.

### Why Node-Media-Server?
- **Battle-tested** RTMP server with 5k+ GitHub stars
- **FFmpeg integration** for HLS transcoding built-in
- **Event hooks** for stream lifecycle (prePublish, donePublish, etc.)
- **Lightweight** compared to alternatives like Wowza or Red5

Trade-off: Limited to Node.js ecosystem; C-based servers like SRS might be more performant.

### Why PostgreSQL + Redis?
- **PostgreSQL** for relational data (users, destinations, sessions) with JSONB support for flexible metadata
- **Redis** for ephemeral session state and real-time viewer counts
- **Cloud SQL compatibility** - easy migration to managed services

### Frontend-Backend Communication Pattern
1. **REST API** - CRUD operations for persistent data (users, destinations)
2. **WebSocket** - Real-time signaling for stream start/stop events
3. **RTMP Ingest** - Browser captures → WebRTC → (future) → RTMP server
4. **HLS Playback** - RTMP → FFmpeg → HLS for preview

Current gap: WebRTC→RTMP bridge not yet implemented.

---

## Backend API Endpoints

The backend server (`backend/server.js`) exposes the following REST API:

### Health & Database
- `GET /health` - Server health check with database status
- `GET /api/test-db` - Test database connectivity
- `POST /api/init-database` - Initialize database schema (one-time setup)

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user (body: `{email, username}`)

### Destinations
- `GET /api/users/:userId/destinations` - Get user's streaming destinations
- `POST /api/users/:userId/destinations` - Create destination (body: `{platform, name, stream_key, stream_url}`)
- `PATCH /api/destinations/:id` - Update destination status (body: `{is_active}`)
- `DELETE /api/destinations/:id` - Delete destination

### Stream Sessions
- `GET /api/users/:userId/sessions` - Get user's stream history (last 50)
- `POST /api/sessions` - Create stream session (body: `{user_id, title, description, metadata}`)
- `PATCH /api/sessions/:id/end` - End active stream session

### WebSocket Messages
- `stream_start` → receives `stream_started`
- `stream_stop` → receives `stream_stopped`

---

## When Adding Features

1. **New Layouts:** Edit `CanvasCompositor.tsx` draw loop and add to `LayoutMode` enum in `types.ts`
2. **New Media Types:** Update `MediaType` in `types.ts`, handle in `MediaBin.tsx`
3. **New Destinations:** Extend `Platform` enum in `types.ts` and `DestinationManager.tsx` presets
4. **Backend Endpoints:** Add routes to `backend/server.js` following existing CRUD patterns
5. **Database Changes:** Update `init.sql` and restart postgres container, or use `/api/init-database`

---

## Troubleshooting

### Backend Won't Start
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
docker-compose logs postgres

# Check if port 3000 is already in use
lsof -i :3000

# Reset database
docker-compose down -v
docker-compose up postgres
curl -X POST http://localhost:3000/api/init-database
```

### Frontend Can't Connect to Backend
```bash
# Verify backend is running
curl http://localhost:3000/health

# Check VITE_BACKEND_URL is set correctly
echo $VITE_BACKEND_URL

# Check browser console for CORS errors
# If CORS error: backend has CORS enabled, check URL matches exactly
```

### Database Connection Issues
```bash
# Test database connectivity
curl http://localhost:3000/api/test-db

# Check PostgreSQL logs
docker-compose logs postgres | grep ERROR

# Verify credentials match between docker-compose.yml and backend/server.js
```

### RTMP Not Working
```bash
# Ensure ENABLE_RTMP=true is set
docker-compose logs backend | grep RTMP

# Check if port 1935 is accessible
telnet localhost 1935

# Note: RTMP is disabled by default for Cloud Run compatibility
```

---

## Testing Approach

Currently no automated test infrastructure exists. Recommended setup:
- **Frontend:** Vitest + React Testing Library + Testing Playground
- **Backend:** Jest + Supertest for API endpoint testing
- **E2E:** Playwright for full streaming workflow tests
- **Load Testing:** k6 for RTMP connection stress testing

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

## Backend Database Connection

The backend supports both local PostgreSQL and Google Cloud SQL:

### Local Development (Docker Compose)
```bash
DATABASE_URL=postgresql://streamhub:streamhub@postgres:5432/streamhub
```

### Cloud Run (GCP)
```bash
INSTANCE_CONNECTION_NAME=project:region:instance
DB_USER=streamhub
DB_PASS=your-password
DB_NAME=streamhub
```

The server automatically detects Cloud SQL via the `INSTANCE_CONNECTION_NAME` environment variable and connects using Unix sockets at `/cloudsql/...`.

### Initializing the Database

After first deployment or when schema changes:
```bash
curl -X POST http://localhost:3000/api/init-database
```

This creates all tables, indexes, triggers, and sample data.

---

## Priority Next Steps

1. **Implement WebRTC→RTMP bridge** - The core streaming functionality (most critical)
2. **Connect frontend to backend API** - Replace mock authentication with real endpoints
3. **Add JWT authentication** - Secure API endpoints with token-based auth
4. **FFmpeg relay logic** - Multi-platform RTMP push from single ingest
5. **Enable RTMP in production** - Configure Cloud Run or separate VM for RTMP service
