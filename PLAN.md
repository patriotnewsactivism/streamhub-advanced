# Project Plan: StreamHub Pro

## 1. Project Vision
To build a "OneStream" alternative that runs primarily in the browser, reducing costs for creators. The goal is to provide a "Studio" experience where users can mix feeds, manage assets, and broadcast to multiple social platforms simultaneously without needing complex desktop software like OBS.

## 2. Architecture

### Frontend (Current Focus)
- **State Management:** React Hooks (`useState`, `useRef`) for managing stream state, media assets, and layouts.
- **Compositor:** A custom `CanvasCompositor` component that acts as the "OBS Scene". It draws the camera, screen share, video files, and images onto a single HTML5 Canvas 30-60 times per second.
- **Stream Capture:** `canvas.captureStream()` turns the visual layout into a MediaStream that can be sent to a backend or recorder.

### Backend (Required for Production)
*Currently, the app mocks the "Go Live" connection because browsers cannot send RTMP directly.*
- **Ingest Server:** A Node.js or Go server is required to accept the WebRTC/WebSocket stream from the frontend.
- **Transcoder:** FFmpeg instance to convert the incoming stream into RTMP packets.
- **Multi-cast:** The backend pushes the single stream to multiple RTMP URLs (YouTube, Twitch, Facebook) simultaneously.

## 3. Current Feature Set (Done ✅)
*   **Canvas Mixing:** Successfully mixes Camera, Screen, Video Files, and Image Overlays.
*   **Layout Engine:** 5 robust layouts (Solo, Screen, PIP, Split, Newsroom).
*   **Media Bin:** Upload/toggle logic for local files.
*   **Direct URL Import:** "Cloud" import via direct links.
*   **AI Integration:** Title/Hashtag generation via Google Gemini.
*   **Destination UI:** Management of Stream Keys and Server URLs.
*   **Hardware Control:** Mute/Unmute Cam and Mic; specific error handling for permissions.
*   **Notifications:** Native Intent generation for Email/SMS.

## 4. To-Do List & Roadmap 📝

### Phase 1: Core Functionality (Immediate)
- [ ] **Local Recording:** Implement `MediaRecorder` API to allow users to record the canvas output to a `.webm` or `.mp4` file locally without streaming.
- [ ] **Audio Mixing:** The current app plays audio but lacks a visual mixer. Need volume sliders for Mic, System Audio, and Media File Audio independently.
- [ ] **Scene Transitions:** Add simple fade/cut transitions when switching layouts or media assets so it doesn't "snap".
- [ ] **Draggable PIP:** Allow users to drag the Picture-in-Picture box around the canvas.

### Phase 2: Real Connectivity (The "Backend" Gap)
- [ ] **WebRTC -> RTMP Bridge:** Build a small Node.js WebSocket server to receive the `canvas.captureStream()` data.
- [ ] **FFmpeg Integration:** Pipe the received data into FFmpeg to stream to the actual RTMP URLs provided in the `DestinationManager`.
- [ ] **Connection Persistence:** Handle network drops and auto-reconnect logic.

### Phase 3: "Premium" OneStream Features
- [ ] **Real OAuth Integrations:** Replace the "Paste Stream Key" method with "Log in with YouTube" (requires verified Google Cloud Project and backend token handling).
- [ ] **Real Cloud Storage API:** Integrate Google Drive Picker API / Dropbox Chooser API to browse files visually instead of pasting URLs.
- [ ] **Scheduled Streams:** Add logic to schedule a stream for a future date (requires backend cron jobs).
- [ ] **Unified Chat:** A widget that aggregates comments from YouTube, Facebook, and Twitch into a single overlay on the canvas.

### Phase 4: Polish & UX
- [ ] **Green Screen (Chroma Key):** Add a shader to the Canvas Compositor to remove green backgrounds from the webcam feed.
- [ ] **Virtual Backgrounds:** Use body segmentation (MediaPipe) to blur or replace background without a green screen.
- [ ] **Theme Builder:** Allow users to upload their own frames/borders for the "Newsroom" layout.

## 5. Known Issues / Constraints
1.  **Audio Sync:** HTML5 Video elements and Canvas draw loops can sometimes drift out of sync with audio. `AudioContext` graph needs to be tightly coupled.
2.  **Browser Performance:** Heavy video decoding (playing a 4K video file while encoding a stream) can cause lag on low-end laptops. WebCodecs API should be explored to replace standard Video Elements for rendering.
3.  **CORS:** Loading images/videos from external URLs (Cloud Import) directly onto a Canvas "taints" the canvas, preventing `captureStream()`.
    *   *Fix:* Requires a proxy or ensuring the source sends `Access-Control-Allow-Origin: *`.

## 6. Business Logic (Future)
- [ ] **User Accounts:** Firebase/Supabase Auth to save destinations and media libraries.
- [ ] **Subscription Gate:** Stripe integration to limit multi-streaming to paid users.
