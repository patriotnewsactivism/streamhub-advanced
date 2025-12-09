const { spawn } = require('child_process');
const { PassThrough } = require('stream');

/**
 * StreamManager - Handles WebRTC to RTMP bridge using FFmpeg
 * Manages multiple concurrent streams and destinations
 */
class StreamManager {
  constructor() {
    this.activeStreams = new Map(); // userId -> streamInfo
  }

  /**
   * Start a new stream session
   * @param {string} userId - User ID
   * @param {Array} destinations - Array of {platform, streamUrl, streamKey}
   * @returns {Object} Stream session info
   */
  startStream(userId, destinations) {
    if (this.activeStreams.has(userId)) {
      throw new Error('User already has an active stream');
    }

    const sessionId = `${userId}_${Date.now()}`;
    const inputStream = new PassThrough();
    const ffmpegProcesses = [];

    // Create FFmpeg process for each destination
    destinations.forEach((dest, index) => {
      const rtmpUrl = `${dest.streamUrl}/${dest.streamKey}`;

      console.log(`[StreamManager] Starting FFmpeg for destination ${index + 1}: ${dest.platform}`);

      const ffmpegArgs = [
        '-i', 'pipe:0', // Input from stdin
        '-c:v', 'libx264', // Video codec
        '-preset', 'veryfast', // Encoding speed preset
        '-tune', 'zerolatency', // Low latency tuning
        '-b:v', '2500k', // Video bitrate
        '-maxrate', '2500k', // Max bitrate
        '-bufsize', '5000k', // Buffer size
        '-pix_fmt', 'yuv420p', // Pixel format
        '-g', '60', // GOP size (keyframe interval)
        '-c:a', 'aac', // Audio codec
        '-b:a', '128k', // Audio bitrate
        '-ar', '44100', // Audio sample rate
        '-f', 'flv', // Output format
        rtmpUrl
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      // Pipe input stream to this FFmpeg process
      inputStream.pipe(ffmpeg.stdin);

      ffmpeg.stderr.on('data', (data) => {
        const message = data.toString();
        // Only log important messages to avoid spam
        if (message.includes('error') || message.includes('Error')) {
          console.error(`[FFmpeg ${dest.platform}] ${message}`);
        }
      });

      ffmpeg.on('close', (code) => {
        console.log(`[FFmpeg ${dest.platform}] Process exited with code ${code}`);
      });

      ffmpeg.on('error', (err) => {
        console.error(`[FFmpeg ${dest.platform}] Error:`, err);
      });

      ffmpegProcesses.push({
        process: ffmpeg,
        destination: dest,
        status: 'starting'
      });
    });

    const streamInfo = {
      sessionId,
      userId,
      inputStream,
      ffmpegProcesses,
      startTime: new Date(),
      destinations: destinations.map(d => ({
        platform: d.platform,
        name: d.name,
        status: 'connecting'
      }))
    };

    this.activeStreams.set(userId, streamInfo);

    // Update destination statuses to 'live' after a delay (simulating connection)
    setTimeout(() => {
      if (this.activeStreams.has(userId)) {
        const stream = this.activeStreams.get(userId);
        stream.destinations.forEach(d => d.status = 'live');
        stream.ffmpegProcesses.forEach(p => p.status = 'live');
      }
    }, 3000);

    return {
      sessionId,
      destinations: streamInfo.destinations
    };
  }

  /**
   * Write video chunk to stream
   * @param {string} userId - User ID
   * @param {Buffer} chunk - Video data chunk
   */
  writeChunk(userId, chunk) {
    const streamInfo = this.activeStreams.get(userId);
    if (!streamInfo) {
      throw new Error('No active stream for this user');
    }

    try {
      streamInfo.inputStream.write(chunk);
    } catch (error) {
      console.error(`[StreamManager] Error writing chunk for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Stop a stream session
   * @param {string} userId - User ID
   * @returns {Object} Stream session summary
   */
  stopStream(userId) {
    const streamInfo = this.activeStreams.get(userId);
    if (!streamInfo) {
      throw new Error('No active stream for this user');
    }

    console.log(`[StreamManager] Stopping stream for user ${userId}`);

    // Close input stream
    streamInfo.inputStream.end();

    // Kill all FFmpeg processes
    streamInfo.ffmpegProcesses.forEach(({ process, destination }) => {
      try {
        process.stdin.end();
        process.kill('SIGTERM');
        console.log(`[StreamManager] Stopped FFmpeg for ${destination.platform}`);
      } catch (error) {
        console.error(`[StreamManager] Error stopping FFmpeg for ${destination.platform}:`, error);
      }
    });

    const duration = Math.floor((new Date() - streamInfo.startTime) / 1000);
    const summary = {
      sessionId: streamInfo.sessionId,
      duration,
      destinations: streamInfo.destinations
    };

    this.activeStreams.delete(userId);

    return summary;
  }

  /**
   * Get stream status for a user
   * @param {string} userId - User ID
   * @returns {Object|null} Stream status or null if no active stream
   */
  getStreamStatus(userId) {
    const streamInfo = this.activeStreams.get(userId);
    if (!streamInfo) {
      return null;
    }

    return {
      sessionId: streamInfo.sessionId,
      startTime: streamInfo.startTime,
      duration: Math.floor((new Date() - streamInfo.startTime) / 1000),
      destinations: streamInfo.destinations
    };
  }

  /**
   * Check if user has an active stream
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  hasActiveStream(userId) {
    return this.activeStreams.has(userId);
  }

  /**
   * Get all active streams (for admin/monitoring)
   * @returns {Array} Array of active stream info
   */
  getAllActiveStreams() {
    return Array.from(this.activeStreams.entries()).map(([userId, info]) => ({
      userId,
      sessionId: info.sessionId,
      startTime: info.startTime,
      duration: Math.floor((new Date() - info.startTime) / 1000),
      destinationCount: info.destinations.length
    }));
  }
}

module.exports = new StreamManager();
