
export enum Platform {
  YOUTUBE = 'YouTube',
  FACEBOOK = 'Facebook',
  TWITCH = 'Twitch',
  CUSTOM_RTMP = 'Custom RTMP'
}

export enum LayoutMode {
  FULL_CAM = 'FULL_CAM',
  FULL_SCREEN = 'FULL_SCREEN',
  PIP = 'PIP', // Picture in Picture
  SPLIT = 'SPLIT', // Side by side
  NEWSROOM = 'NEWSROOM' // Shoulder view
}

export type MediaType = 'image' | 'video' | 'audio';

export type StreamMode = 'local' | 'cloud_vm';

export interface Destination {
  id: string;
  platform: Platform;
  name: string; // e.g., "Personal YouTube", "Business YouTube"
  streamKey: string;
  serverUrl?: string;
  isEnabled: boolean;
  status: 'offline' | 'connecting' | 'live' | 'error';
  connectedAccount?: string; // For OAuth connected accounts
}

export interface StreamConfig {
  title: string;
  description: string;
  hashtags: string[];
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  name: string;
  source?: 'local' | 'cloud';
}

export interface AppState {
  isStreaming: boolean;
  isRecording: boolean;
  streamDuration: number;
  recordingDuration: number;
}

export interface NotificationConfig {
  email: string;
  phone: string;
  notifyOnLive: boolean;
  notifyOnCountdown: boolean;
}

export type CloudProvider = 'Google Drive' | 'Dropbox' | 'OneDrive' | 'Box' | 'AWS S3' | 'Google Cloud';

export interface CloudVMStats {
  status: 'booting' | 'idle' | 'fetching' | 'streaming';
  bandwidthSaved: number; // in MB
  serverSpeed: number; // in Mbps
  activeJob?: string;
}

export interface AudioMixerState {
  micVolume: number; // 0 to 1
  musicVolume: number;
  videoVolume: number;
}
