import { Destination } from '../types';
import authService from './authService';
import { API_BASE as CLIENT_API_BASE } from './apiClient';

const resolveWebSocketUrl = () => {
  const explicitUrl = import.meta.env.VITE_BACKEND_WS_URL;
  if (explicitUrl) return explicitUrl.replace(/\/$/, '');

  const base = (CLIENT_API_BASE || '').replace(/\/$/, '');
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return `${base.replace(/^http/, 'ws')}`;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/^http/, 'ws');
  }

  return 'ws://localhost:3000';
};

const WS_URL = resolveWebSocketUrl();
const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

interface StreamStartResponse {
  success: boolean;
  sessionId: string;
  dbSessionId: number;
  destinations: Array<{
    platform: string;
    name: string;
    status: string;
  }>;
  startTime: string;
}

interface StreamStopResponse {
  success: boolean;
  duration: number;
  destinations: Array<{
    platform: string;
    name: string;
    status: string;
  }>;
}

class StreamingService {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isStreaming = false;
  private sessionId: string | null = null;

  /**
   * Start a streaming session
   */
  async startStream(
    masterStream: MediaStream,
    destinations: Destination[],
    title?: string,
    description?: string
  ): Promise<StreamStartResponse> {
    // Prepare destinations for backend
    const destData = destinations
      .filter(d => d.isEnabled)
      .map(d => ({
        platform: d.platform,
        name: d.name,
        streamUrl: d.streamUrl,
        streamKey: d.streamKey,
      }));

    if (destData.length === 0) {
      throw new Error('At least one destination must be enabled');
    }

    // Call backend API to start stream session
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}/api/stream/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        destinations: destData,
        title,
        description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start stream');
    }

    const data: StreamStartResponse = await response.json();
    this.sessionId = data.sessionId;

    // Connect WebSocket for stream data
    await this.connectWebSocket(token, masterStream);

    this.isStreaming = true;

    return data;
  }

  /**
   * Stop streaming session
   */
  async stopStream(): Promise<StreamStopResponse> {
    this.isStreaming = false;

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: 'stream_stop' }));
      this.ws.close();
      this.ws = null;
    }

    // Call backend API to stop stream
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}/api/stream/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop stream');
    }

    this.sessionId = null;

    return response.json();
  }

  /**
   * Connect WebSocket and start sending stream data
   */
  private async connectWebSocket(token: string, stream: MediaStream): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket handshake timed out'));
      }, 8000);

      this.ws.onopen = () => {
        console.log('[StreamingService] WebSocket connected');

        this.ws!.send(JSON.stringify({
          type: 'authenticate',
          token,
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[StreamingService] WebSocket message:', data.type);

          switch (data.type) {
            case 'authenticated':
              clearTimeout(timeout);
              console.log('[StreamingService] Authenticated, starting MediaRecorder');
              this.startMediaRecorder(stream);
              this.ws!.send(JSON.stringify({ type: 'stream_start' }));
              resolve();
              break;

            case 'stream_started':
              console.log('[StreamingService] Stream started successfully');
              break;

            case 'error':
              clearTimeout(timeout);
              console.error('[StreamingService] Error:', data.message);
              reject(new Error(data.message));
              break;
          }
        } catch (error) {
          clearTimeout(timeout);
          console.error('[StreamingService] Error parsing WebSocket message:', error);
          reject(new Error('Invalid message from streaming server'));
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('[StreamingService] WebSocket error:', error);
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = () => {
        clearTimeout(timeout);
        console.log('[StreamingService] WebSocket disconnected');
        if (this.isStreaming) {
          console.warn('[StreamingService] Unexpected disconnect while streaming');
          this.isStreaming = false;
        }
      };
    });
  }

  /**
   * Start MediaRecorder to capture and send stream data
   */
  private startMediaRecorder(stream: MediaStream): void {
    try {
      // Try VP9 first, fall back to VP8
      const options = [
        { mimeType: 'video/webm; codecs=vp9' },
        { mimeType: 'video/webm; codecs=vp8' },
        { mimeType: 'video/webm' },
      ];

      let selectedOption = null;
      for (const option of options) {
        if (MediaRecorder.isTypeSupported(option.mimeType)) {
          selectedOption = option;
          break;
        }
      }

      if (!selectedOption) {
        throw new Error('No supported video codec found');
      }

      this.mediaRecorder = new MediaRecorder(stream, selectedOption);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Convert Blob to ArrayBuffer and send
          event.data.arrayBuffer().then((buffer) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(buffer);
            }
          });
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('[StreamingService] MediaRecorder error:', error);
      };

      // Start recording with 100ms chunks for low latency
      this.mediaRecorder.start(100);

      console.log('[StreamingService] MediaRecorder started');
    } catch (error) {
      console.error('[StreamingService] Failed to start MediaRecorder:', error);
      throw error;
    }
  }

  /**
   * Get stream status
   */
  async getStreamStatus(): Promise<any> {
    const response = await authService.authenticatedFetch(`${API_BASE}/api/stream/status`);

    if (!response.ok) {
      throw new Error('Failed to get stream status');
    }

    return response.json();
  }

  /**
   * Get stream history
   */
  async getStreamHistory(): Promise<any> {
    const response = await authService.authenticatedFetch(`${API_BASE}/api/stream/history`);

    if (!response.ok) {
      throw new Error('Failed to get stream history');
    }

    return response.json();
  }

  /**
   * Check if currently streaming
   */
  isStreamActive(): boolean {
    return this.isStreaming;
  }
}

export const streamingService = new StreamingService();
export default streamingService;
