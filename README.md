# StreamHub Pro

**Professional browser-based live streaming studio** - A OneStream/OBS alternative that enables multi-destination broadcasting without complex desktop software.

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](./docker-compose.yml)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## Overview

StreamHub Pro is a professional-grade streaming studio that runs entirely in your browser. Broadcast to YouTube, Facebook, Twitch, and custom RTMP endpoints simultaneously while managing media assets, selecting dynamic layouts, and leveraging AI for content optimization.

### Key Features

- **Multi-Destination Streaming** - Broadcast to unlimited platforms simultaneously
- **5 Professional Layouts** - Solo, Screen Share, PIP, Split, and Newsroom modes
- **Canvas-Based Compositor** - Real-time 30fps video mixing with HTML5 Canvas
- **Media Asset Management** - Upload images, videos, and audio; import from cloud URLs
- **AI-Powered Metadata** - Generate viral titles, descriptions, and hashtags with Google Gemini
- **Professional Audio Mixer** - Independent volume control for mic, music, and video
- **Local Recording** - Save streams locally as WebM without external services
- **Plan-Based Features** - Free, Pro, and Business tiers with appropriate limits
- **Mobile Responsive** - Full functionality on tablets and phones

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for development)
- [Docker](https://www.docker.com/) & Docker Compose (for production)
- Google Gemini API key (for AI features)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/streamhub-advanced.git
cd streamhub-advanced

# Start all services
docker-compose up --build

# Access the application
open http://localhost:8080
```

### Option 2: Development Mode

```bash
# Install frontend dependencies
npm install

# Set environment variables
export VITE_GEMINI_API_KEY="your-gemini-api-key"

# Start development server
npm run dev

# Access at http://localhost:3000
```

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Browser (React 19 + Vite)                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Studio    │ │   Canvas    │ │  Destination        │   │
│  │  Component  │ │ Compositor  │ │     Manager         │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                         │ WebSocket / HTTP
                         ▼
┌────────────────────────────────────────────────────────────┐
│  Backend (Node.js + Express)                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  REST API   │ │    RTMP     │ │    FFmpeg           │   │
│  │  :3000      │ │   :1935     │ │    Transcoder       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌───────────────────┐  ┌───────────────────┐
│    PostgreSQL     │  │      Redis        │
│      :5432        │  │      :6379        │
└───────────────────┘  └───────────────────┘
```

---

## Usage Guide

### 1. Initial Setup

1. **Grant Permissions** - Allow camera and microphone access when prompted
2. **Add Destinations** - Open the left sidebar and configure your streaming platforms
3. **Enter Stream Keys** - Paste your YouTube/Twitch/Facebook stream keys

### 2. Prepare Your Stream

1. **Upload Media** - Use the right sidebar to add logos, intro videos, or background music
2. **Select Layout** - Choose from Solo, PIP, Split, Screen Share, or Newsroom
3. **Generate Metadata** - Enter your topic and let AI create titles and hashtags

### 3. Go Live

1. **Toggle Destinations** - Enable the platforms you want to broadcast to
2. **Click GO LIVE** - Start broadcasting to all enabled destinations
3. **Monitor Duration** - Track your stream time in the header
4. **End Stream** - Click END STREAM and download your local recording

---

## Layouts

| Layout | Description | Best For |
|--------|-------------|----------|
| **Solo** | Full-screen camera | Vlogs, talking head |
| **Screen Share** | Full-screen content | Tutorials, demos |
| **PIP** | Content + draggable presenter | Gaming, presentations |
| **Split** | Side-by-side view | Interviews, reactions |
| **Newsroom** | Professional shoulder view | News, podcasts |

---

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| **frontend** | 8080 | React app served by Nginx |
| **backend** | 3000 | Express API |
| **backend** | 1935 | RTMP ingest server |
| **backend** | 8000 | HLS output server |
| **redis** | 6379 | Session cache |
| **postgres** | 5432 | User data storage |

---

## Configuration

### Environment Variables

```bash
# Frontend (Vite)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Backend (docker-compose.yml)
NODE_ENV=production
REDIS_HOST=redis
REDIS_PORT=6379
DATABASE_URL=postgresql://streamhub:streamhub@postgres:5432/streamhub
```

### Plan Limits

| Plan | Destinations | Cloud VM | Watermark |
|------|-------------|----------|-----------|
| Free | 1 | No | Yes |
| Free Trial | 99 | Yes | No |
| Pro | 99 | Yes | No |
| Business | 99 | Yes | No |
| Admin | 999 | Yes | No |

---

## Technology Stack

### Frontend
- **React 19** - Latest React with hooks
- **TypeScript 5.8** - Type safety
- **Vite 6** - Fast build tooling
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **React Router DOM 7** - Client-side routing

### Backend
- **Node.js 20** - JavaScript runtime
- **Express 4** - Web framework
- **Node-Media-Server** - RTMP/HLS server
- **FFmpeg** - Video transcoding
- **WebSocket (ws)** - Real-time communication

### Data Layer
- **PostgreSQL 15** - Relational database
- **Redis 7** - Cache and sessions

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **Terraform** - Infrastructure as Code

---

## Project Status

### Completed
- Canvas-based video compositor with 5 layouts
- Media asset management with cloud import
- Audio mixer with Web Audio API
- AI metadata generation (Gemini)
- Destination manager for RTMP endpoints
- Local recording functionality
- Mobile responsive design
- Docker deployment setup

### In Progress
- WebRTC to RTMP bridge implementation
- User authentication system
- Database integration for persistence

### Planned
- OAuth integrations (YouTube, Twitch)
- Scheduled streaming
- Chat aggregation overlay
- Green screen (chroma key)
- Virtual backgrounds

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Opening Pull Requests for Large Changes

When a branch (for example, `backend-database-integration`) contains a very large diff (9k+ lines), break it into reviewable slices so GitHub can render the changes and reviewers can provide focused feedback.

1. **Preview the size**
   ```bash
   git diff --stat main...backend-database-integration
   ```
2. **Split by concern** – separate backend, schema, and front-end updates into focused feature branches (e.g., `backend-db-schema`, `backend-api-handlers`, `frontend-db-hooks`).
   ```bash
   git checkout -b backend-db-schema main
   git cherry-pick <hashes-for-schema-work>
   git push origin backend-db-schema
   ```
3. **Open multiple PRs** – create one PR per focused branch. Reference the parent initiative in each description.
4. **Keep follow-up patches small** – for remaining changes, repeat the cherry-pick process into additional branches until each PR is under a few thousand lines.
5. **Link PRs together** – use GitHub’s “linked pull request” or issue references so reviewers see the sequence.

This approach avoids GitHub’s diff rendering limits and shortens review cycles while keeping the original work intact on the source branch.
---

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guide for AI assistants
- [PLAN.md](./PLAN.md) - Product roadmap and vision
- [TODO.md](./TODO.md) - Prioritized task list
- [GCP_DEPLOYMENT.md](./GCP_DEPLOYMENT.md) - Google Cloud deployment
- [DOCKER_README.md](./DOCKER_README.md) - Docker setup guide

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/your-org/streamhub-advanced/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/streamhub-advanced/discussions)

---

*Built for the creator economy.*
