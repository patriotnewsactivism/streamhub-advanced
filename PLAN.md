# StreamHub Pro - Product Roadmap & Technical Plan

> Strategic vision and implementation roadmap for building a production-ready streaming platform.

---

## Vision Statement

Build a **browser-first streaming studio** that democratizes professional live broadcasting. StreamHub Pro eliminates the need for complex desktop software like OBS while providing enterprise-grade features at a fraction of the cost of services like OneStream.

### Target Users
- **Content Creators** - YouTubers, Twitch streamers, TikTokers
- **Businesses** - Marketing teams, corporate communications
- **Educators** - Online teachers, course creators
- **Events** - Virtual conferences, webinars, live shows

---

## Current State Analysis

### Frontend (80% Complete)

| Component | Status | Quality |
|-----------|--------|---------|
| Canvas Compositor | Done | Production-ready |
| Layout Engine (5 modes) | Done | Production-ready |
| Media Bin | Done | Production-ready |
| Destination Manager | Done | Production-ready |
| Audio Mixer | Done | Production-ready |
| AI Integration | Done | Production-ready |
| Plan-based Gating | Done | Production-ready |
| Mobile Responsive | Done | Production-ready |
| Local Recording | Done | Production-ready |
| Draggable PIP | Done | Production-ready |
| Authentication UI | Done | Mock only |

### Backend (25% Complete)

| Component | Status | Quality |
|-----------|--------|---------|
| Express Server | Done | Stub only |
| Node-Media-Server Config | Done | Untested |
| WebSocket Setup | Partial | Basic skeleton |
| Database Connection | Not Done | - |
| Redis Integration | Not Done | - |
| WebRTC-RTMP Bridge | Not Done | - |
| Authentication | Not Done | - |
| API Endpoints | Not Done | - |
| FFmpeg Relay | Not Done | - |

### Infrastructure (70% Complete)

| Component | Status | Quality |
|-----------|--------|---------|
| Docker Compose | Done | Production-ready |
| PostgreSQL Schema | Done | Production-ready |
| Nginx Config | Done | Production-ready |
| Dockerfile (Frontend) | Done | Production-ready |
| Dockerfile (Backend) | Done | Auto-generates server |
| GCP Deployment Docs | Done | Comprehensive |
| CI/CD Pipeline | Not Done | - |
| Monitoring/Logging | Not Done | - |
| SSL/TLS | Not Done | - |

---

## Architecture Evolution

### Current State (v0.x)
```
Browser → Canvas → MediaRecorder → Local Download
                 ↓
         Simulated RTMP Status
```

### Target State (v1.0)
```
Browser → Canvas → captureStream() → WebSocket → Backend → FFmpeg → RTMP
                                              ↘
                                          HLS Output → CDN
```

### Future State (v2.0)
```
Browser → Canvas → WebRTC → SFU → FFmpeg → Multi-RTMP
    ↓                        ↓
Cloud VM (Optional)    Real-time Analytics
    ↓                        ↓
CPU Offload           Viewer Dashboard
```

---

## Implementation Phases

## Phase 1: Core Backend (Critical Path)
**Goal:** Enable real streaming to RTMP endpoints

### 1.1 Create Actual Backend Server
**File:** `backend/server.js`

```javascript
// Required modules
- express (HTTP API)
- ws (WebSocket signaling)
- node-media-server (RTMP handling)
- pg (PostgreSQL client)
- redis (Session cache)
- fluent-ffmpeg (Stream processing)
```

**Endpoints to implement:**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/user/profile` - Get user data
- `GET /api/destinations` - List user destinations
- `POST /api/destinations` - Create destination
- `DELETE /api/destinations/:id` - Remove destination
- `POST /api/stream/start` - Initialize stream session
- `POST /api/stream/stop` - End stream session
- `GET /api/stream/status` - Get current stream status

### 1.2 WebRTC to RTMP Bridge
**Critical functionality - the heart of the streaming platform**

```
Browser Canvas → captureStream(30) → MediaRecorder
                                          ↓
                                   WebSocket Binary
                                          ↓
                              Backend WebSocket Handler
                                          ↓
                              FFmpeg stdin pipe
                                          ↓
                              RTMP output to destinations
```

**Implementation approach:**
1. Frontend sends MediaRecorder chunks via WebSocket
2. Backend receives binary data and pipes to FFmpeg
3. FFmpeg transcodes to RTMP format
4. FFmpeg pushes to multiple RTMP endpoints

### 1.3 Multi-Destination Relay
**FFmpeg command pattern:**
```bash
ffmpeg -i pipe:0 \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -c:a aac -ar 44100 \
  -f flv rtmp://youtube.com/live/KEY1 \
  -f flv rtmp://twitch.tv/live/KEY2 \
  -f flv rtmp://custom.server/live/KEY3
```

### 1.4 Database Integration
**Connect PostgreSQL for:**
- User accounts and authentication
- Stream destination storage
- Session history and analytics
- Media asset metadata

---

## Phase 2: Authentication & Security

### 2.1 JWT Authentication
- Generate tokens on login
- Validate tokens on API requests
- Refresh token mechanism
- Secure cookie storage

### 2.2 Password Security
- bcrypt hashing
- Password strength validation
- Rate limiting on auth endpoints

### 2.3 Session Management
- Redis-based session storage
- Session expiration
- Multi-device handling

### 2.4 Frontend Auth Integration
- Replace mock user with real auth
- Protected routes
- Token refresh on 401

---

## Phase 3: Premium Features

### 3.1 OAuth Integrations
**Priority order:**
1. YouTube - Most common streaming destination
2. Twitch - Gaming audience
3. Facebook - Business users
4. TikTok - Short-form content

**Implementation:**
- OAuth 2.0 flow for each platform
- Store refresh tokens securely
- Auto-populate stream keys
- One-click "Go Live" to connected accounts

### 3.2 Cloud Storage Integration
**File pickers for:**
- Google Drive
- Dropbox
- OneDrive
- AWS S3

**Functionality:**
- Visual file browser
- Import media without URL
- CORS proxy for canvas compatibility

### 3.3 Scheduled Streaming
- Schedule streams for future times
- Countdown timers
- Auto-start streams
- Calendar integration

### 3.4 Chat Aggregation
- Unified chat overlay
- Real-time messages from all platforms
- Moderation tools
- Chat replay

---

## Phase 4: Video Processing Enhancements

### 4.1 Green Screen (Chroma Key)
**Canvas shader approach:**
```javascript
// In CanvasCompositor draw loop
const imageData = ctx.getImageData(x, y, w, h);
for (let i = 0; i < imageData.data.length; i += 4) {
  const r = imageData.data[i];
  const g = imageData.data[i + 1];
  const b = imageData.data[i + 2];
  if (g > r * 1.4 && g > b * 1.4) {
    imageData.data[i + 3] = 0; // Set alpha to transparent
  }
}
ctx.putImageData(imageData, x, y);
```

### 4.2 Virtual Backgrounds
**MediaPipe integration:**
- Body segmentation
- Background blur
- Background replacement
- Performance optimization

### 4.3 Scene Transitions
- Fade in/out
- Slide transitions
- Cut transitions
- Configurable duration

### 4.4 Lower Thirds & Overlays
- Animated text overlays
- Logo animations
- Ticker/crawl text
- Timer/countdown displays

---

## Phase 5: Cloud VM Mode

### 5.1 Cloud VM Architecture
```
User Browser ──WebRTC──► Cloud VM ──RTMP──► Destinations
     ↓                      ↓
  Control              OBS/FFmpeg
  Signals              Processing
```

### 5.2 Benefits
- Offload encoding from user's device
- Consistent bandwidth from cloud
- Higher quality streams on weak connections
- Scheduled/unattended streaming

### 5.3 Implementation
- GCP Compute Engine integration
- VM provisioning API
- WebRTC relay setup
- Bandwidth metering

---

## Phase 6: Analytics & Monetization

### 6.1 Stream Analytics
- Viewer counts (aggregated)
- Stream health metrics
- Bitrate graphs
- Platform-specific stats

### 6.2 Recording & VOD
- Cloud recording option
- Automatic VOD upload
- Clip generation
- Highlight detection

### 6.3 Subscription Billing
- Stripe integration
- Plan management
- Usage metering
- Invoice generation

---

## Technical Debt & Improvements

### Performance
- [ ] WebCodecs API for video decoding (replace HTMLVideoElement)
- [ ] OffscreenCanvas for compositor (worker thread)
- [ ] WASM video processing
- [ ] Adaptive bitrate encoding

### Security
- [ ] CSRF protection
- [ ] Input sanitization
- [ ] Rate limiting
- [ ] Content Security Policy

### Reliability
- [ ] Auto-reconnect on network drop
- [ ] Stream health monitoring
- [ ] Fallback RTMP servers
- [ ] Error recovery mechanisms

### Testing
- [ ] Unit tests (Vitest)
- [ ] Integration tests (Playwright)
- [ ] Load testing
- [ ] E2E streaming tests

---

## Known Constraints & Solutions

### Browser Limitations

| Constraint | Solution |
|------------|----------|
| Can't send RTMP directly | Backend WebRTC-RTMP bridge |
| Canvas CORS tainting | CORS proxy for external media |
| Audio sync drift | Tight AudioContext coupling |
| CPU-intensive encoding | Cloud VM offload option |

### Technical Challenges

| Challenge | Mitigation |
|-----------|------------|
| WebSocket binary handling | Chunked transfer, buffering |
| FFmpeg process management | PM2 or supervisord |
| Multi-destination latency | Parallel FFmpeg outputs |
| Database connection pooling | pg-pool configuration |

---

## Success Metrics

### Phase 1 (Core Backend)
- [ ] Stream successfully reaches YouTube
- [ ] Stream successfully reaches Twitch
- [ ] Audio/video sync within 100ms
- [ ] Reconnection on network drop

### Phase 2 (Auth)
- [ ] User can register and login
- [ ] Destinations persist across sessions
- [ ] Session expires correctly

### Phase 3 (Premium)
- [ ] One-click OAuth streaming
- [ ] Scheduled streams execute
- [ ] Chat overlay functional

### Phase 4 (Video)
- [ ] Green screen removes background
- [ ] Transitions are smooth
- [ ] Lower thirds animate

### Phase 5 (Cloud VM)
- [ ] VM provisions in < 60 seconds
- [ ] Stream quality improves
- [ ] Metering is accurate

---

## Timeline Estimation

| Phase | Complexity | Dependencies |
|-------|------------|--------------|
| Phase 1 | High | None |
| Phase 2 | Medium | Phase 1 |
| Phase 3 | High | Phase 2 |
| Phase 4 | Medium | Phase 1 |
| Phase 5 | Very High | Phase 3 |
| Phase 6 | High | Phase 2, 5 |

---

## Next Immediate Steps

1. **Create `backend/server.js`** with actual implementation
2. **Implement WebSocket binary handler** for stream data
3. **Add FFmpeg pipeline** for RTMP output
4. **Connect PostgreSQL** for user persistence
5. **Implement JWT authentication**
6. **Update frontend** to use real backend APIs

---

*This plan will evolve as we learn from implementation and user feedback.*
