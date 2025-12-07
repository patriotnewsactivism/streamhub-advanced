# StreamHub Pro - Task List

> Prioritized development tasks organized by urgency and impact.

---

## Legend

- **P0** - Critical blocker, required for basic functionality
- **P1** - High priority, needed for production release
- **P2** - Medium priority, enhances user experience
- **P3** - Low priority, nice to have

Status: `[ ]` Todo | `[~]` In Progress | `[x]` Done

---

## P0: Critical Path (Required for MVP)

### Backend Core Implementation

- [ ] **Create `backend/server.js`** - Replace auto-generated stub with real implementation
  - File: `backend/server.js`
  - Dependencies: express, ws, node-media-server, pg, redis
  - Estimated complexity: High

- [ ] **Implement WebSocket binary stream handler**
  - Accept MediaRecorder chunks from frontend
  - Buffer and pipe to FFmpeg
  - Handle connection drops gracefully

- [ ] **Build FFmpeg RTMP pipeline**
  - Spawn FFmpeg process with stdin pipe
  - Configure for low-latency streaming
  - Output to multiple RTMP endpoints
  - Handle process crashes/restarts

- [ ] **Connect PostgreSQL database**
  - Implement connection pooling
  - Create data access layer
  - Handle connection errors

### Frontend-Backend Integration

- [ ] **Update `Studio.tsx` to use real backend**
  - Replace simulated streaming with WebSocket connection
  - Send MediaRecorder chunks to backend
  - Handle connection status properly

- [ ] **Implement stream start/stop API calls**
  - POST /api/stream/start
  - POST /api/stream/stop
  - Handle errors and reconnection

---

## P1: High Priority (Production Release)

### Authentication System

- [ ] **Implement JWT authentication**
  - User registration endpoint
  - User login endpoint
  - Token generation and validation
  - Refresh token mechanism

- [ ] **Add bcrypt password hashing**
  - Secure password storage
  - Password validation

- [ ] **Redis session management**
  - Store active sessions
  - Handle expiration
  - Multi-device support

- [ ] **Update frontend auth flow**
  - Replace mock auth in `LandingPage.tsx`
  - Store tokens securely
  - Auto-refresh on expiration
  - Handle 401 responses

### API Endpoints

- [ ] **User endpoints**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `GET /api/user/profile`
  - `PUT /api/user/profile`

- [ ] **Destination endpoints**
  - `GET /api/destinations`
  - `POST /api/destinations`
  - `PUT /api/destinations/:id`
  - `DELETE /api/destinations/:id`

- [ ] **Stream session endpoints**
  - `POST /api/stream/start`
  - `POST /api/stream/stop`
  - `GET /api/stream/status`
  - `GET /api/stream/history`

### Error Handling

- [ ] **Backend error handling**
  - Standardized error responses
  - Error logging
  - Graceful degradation

- [ ] **Frontend error boundaries**
  - React error boundaries
  - User-friendly error messages
  - Retry mechanisms

---

## P2: Medium Priority (Enhanced Experience)

### Video Processing

- [ ] **Scene transitions**
  - Fade transition between layouts
  - Configurable transition duration
  - Smooth animation

- [ ] **Green screen (chroma key)**
  - Add to `CanvasCompositor.tsx`
  - Configurable key color
  - Tolerance adjustment

- [ ] **Lower thirds overlay**
  - Animated text entry/exit
  - Customizable styling
  - Position presets

### Audio Improvements

- [ ] **Audio level meters**
  - Visual VU meters
  - Peak detection
  - Clipping warning

- [ ] **System audio capture**
  - Screen share audio
  - Mix with mic

### Quality of Life

- [ ] **Stream preview**
  - Low-latency preview player
  - Health indicators

- [ ] **Keyboard shortcuts**
  - Mute/unmute (M)
  - Camera toggle (C)
  - Go live (Ctrl+Enter)
  - Layout switching (1-5)

- [ ] **Undo/Redo for settings**
  - Track configuration changes
  - Allow reverting

### Infrastructure

- [ ] **CI/CD pipeline**
  - GitHub Actions workflow
  - Automated testing
  - Docker image builds
  - Deployment to GCP

- [ ] **Logging infrastructure**
  - Structured logging
  - Log aggregation
  - Error tracking (Sentry)

- [ ] **Monitoring**
  - Health check dashboard
  - Uptime monitoring
  - Performance metrics

---

## P3: Low Priority (Future Enhancements)

### OAuth Integrations

- [ ] **YouTube OAuth**
  - Google Cloud Console setup
  - OAuth 2.0 flow
  - Token storage
  - Auto stream key retrieval

- [ ] **Twitch OAuth**
  - Twitch Developer Console setup
  - OAuth implementation
  - Stream key auto-fill

- [ ] **Facebook OAuth**
  - Meta for Developers setup
  - Live Video API integration

### Cloud Storage

- [ ] **Google Drive picker**
  - Google Picker API
  - File browser modal
  - Import to Media Bin

- [ ] **Dropbox chooser**
  - Dropbox Chooser integration
  - Direct import

### Advanced Features

- [ ] **Virtual backgrounds**
  - MediaPipe body segmentation
  - Background blur
  - Custom backgrounds

- [ ] **Scheduled streaming**
  - Schedule creation UI
  - Backend cron jobs
  - Auto-start logic

- [ ] **Chat aggregation**
  - YouTube chat API
  - Twitch IRC
  - Unified overlay

- [ ] **Cloud VM streaming**
  - GCP Compute Engine API
  - VM provisioning
  - WebRTC relay
  - Usage metering

### Monetization

- [ ] **Stripe integration**
  - Subscription plans
  - Payment processing
  - Invoice generation

- [ ] **Usage analytics**
  - Stream minutes tracking
  - Bandwidth usage
  - Plan limit enforcement

---

## Testing Tasks

### Unit Tests

- [ ] Set up Vitest
- [ ] Test `CanvasCompositor` layout rendering
- [ ] Test `geminiService` API calls
- [ ] Test authentication utilities
- [ ] Test database access layer

### Integration Tests

- [ ] Set up Playwright
- [ ] Test login flow
- [ ] Test stream start/stop
- [ ] Test destination management
- [ ] Test media upload

### Load Tests

- [ ] Simulate concurrent streams
- [ ] Test WebSocket scalability
- [ ] Test database connection pool

---

## Technical Debt

- [ ] **Replace Tailwind CDN with proper build**
  - Install Tailwind as dev dependency
  - Configure PostCSS
  - Remove CDN from index.html

- [ ] **Type improvements**
  - Stricter TypeScript settings
  - No `any` types
  - Full type coverage

- [ ] **Code organization**
  - Extract hooks to `hooks/` directory
  - Create `utils/` for helpers
  - Consistent file naming

- [ ] **Documentation**
  - JSDoc comments on public APIs
  - API documentation (OpenAPI)
  - Architecture decision records

---

## Quick Wins (Can Be Done Immediately)

- [ ] Add `backend/server.js` to source control (instead of Docker-generated)
- [ ] Add `.env.example` file with required variables
- [ ] Add health check endpoint tests
- [ ] Add input validation to destination forms
- [ ] Add loading states to buttons
- [ ] Add confirmation dialogs for destructive actions

---

## Current Sprint Focus

**Goal:** Achieve real streaming to at least one RTMP endpoint

1. [ ] Create actual `backend/server.js`
2. [ ] Implement WebSocket stream receiver
3. [ ] Add FFmpeg RTMP output
4. [ ] Test with YouTube test stream
5. [ ] Document setup process

---

## Completed Tasks

### Documentation
- [x] Create CLAUDE.md
- [x] Update README.md
- [x] Create PLAN.md
- [x] Create TODO.md

### Frontend
- [x] Canvas-based compositor
- [x] 5 layout modes
- [x] Media bin with upload
- [x] Cloud URL import
- [x] Destination manager UI
- [x] Audio mixer with Web Audio API
- [x] Gemini AI integration
- [x] Plan-based feature gating
- [x] Mobile responsive design
- [x] Local recording (MediaRecorder)
- [x] Draggable PIP

### Infrastructure
- [x] Docker Compose setup
- [x] Frontend Dockerfile
- [x] Backend Dockerfile (stub)
- [x] PostgreSQL init.sql
- [x] Nginx configuration
- [x] GCP deployment docs

---

*Last updated: See git commit timestamp*
