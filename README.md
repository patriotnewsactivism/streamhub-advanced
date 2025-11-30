# StreamHub Pro 🎥

**StreamHub Pro** is a browser-based, professional live streaming studio designed to rival premium tools like OneStream and OBS. It allows content creators to broadcast to multiple destinations simultaneously, manage media assets, arrange dynamic layouts, and utilize AI for stream optimization—all from a modern web interface.

## 🚀 Key Features

### 1. Multi-Destination Streaming
- **Manager:** Configure multiple RTMP endpoints (YouTube, Facebook, Twitch, or Custom).
- **Control:** Toggle individual destinations on/off before or during the stream.
- **Status:** Real-time indicators for connection status.

### 2. Advanced Composition Engine
- **HTML5 Canvas Core:** Real-time mixing of webcam, screen share, and media files.
- **Layouts:**
  - **Solo:** Full-screen camera focus.
  - **Screen Share:** Focus on content with the presenter hidden or minimized.
  - **PIP (Picture-in-Picture):** Presenter overlaid on screen share/video.
  - **Split:** Side-by-side view of presenter and content.
  - **Newsroom:** Professional shoulder-view layout with custom backgrounds.

### 3. Media Bin & Cloud Import
- **Asset Management:** Upload and manage Images, Videos, and Audio tracks locally.
- **Cloud Integration:** Import media directly via URL (supports direct links from S3, Dropbox, etc.).
- **Overlays:** Toggle logos, lower thirds, or images on top of your video feed.
- **Background Music:** Loop audio tracks with volume control.

### 4. AI Studio Assistant
- **Powered by Gemini:** Integrated with Google's Gemini API.
- **Metadata Generation:** Automatically generates viral-style Titles, Descriptions, and Hashtags based on your stream topic.

### 5. Notification Center
- **Alerts:** Setup Email (`mailto`) and SMS (`sms`) triggers to notify followers when you go live.
- **One-Click Share:** Generates pre-filled messages with your stream details.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **Media Processing:** HTML5 Canvas API, MediaStream API
- **AI:** @google/genai SDK
- **Icons:** Lucide React

## 📦 Installation & Setup

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment**
   Ensure you have a valid Google Gemini API Key.
   ```bash
   export API_KEY="your_gemini_api_key"
   ```
4. **Run the application**
   ```bash
   npm start
   ```

## 🎮 Usage Guide

1. **Permissions:** Upon launch, allow access to Camera and Microphone.
2. **Setup Destinations:**
   - Open the right sidebar.
   - Click "Add" to configure YouTube, Twitch, etc.
   - Enter your **Stream Key** and **Server URL** (provided by your platform).
3. **Prepare Media:**
   - Use the left sidebar to upload logos, intro videos, or background music.
   - Use the AI Assistant to generate a title.
4. **Select Layout:** Choose your visual style (e.g., Newsroom) from the bottom deck.
5. **Go Live:** Click the "GO LIVE" button. 

## ⚠️ Browser Limitations (Important)

*   **RTMP Protocol:** Browsers cannot natively speak RTMP (TCP). In a production environment, this application requires a lightweight backend server (Node-Media-Server or FFMPEG) to transcode the browser's WebRTC/Canvas stream to RTMP.
*   **Permissions:** Screen sharing requires specific browser permissions and must be initiated by a user gesture.

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

---
*Built for the AI Studio Era.*