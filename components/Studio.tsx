
import React, { useState, useEffect, useRef } from 'react';
import { 
  Destination, 
  LayoutMode, 
  AppState,
  MediaAsset,
  MediaType,
  NotificationConfig,
  StreamMode,
  AudioMixerState,
  User,
  UserPlan
} from '../types';
import CanvasCompositor, { CanvasRef } from './CanvasCompositor';
import DestinationManager from './DestinationManager';
import LayoutSelector from './LayoutSelector';
import MediaBin from './MediaBin';
import CloudImportModal from './CloudImportModal';
import NotificationPanel from './NotificationPanel';
import CloudVMManager from './CloudVMManager';
import AudioMixer from './AudioMixer';
import OnboardingTour from './OnboardingTour';
import PreStreamConfirmation from './PreStreamConfirmation';
import ChatScreamer, { ChatScreamerMessage } from './ChatScreamer';
import ChatScreamerOverlay from './ChatScreamerOverlay';
import { generateStreamMetadata } from '../services/geminiService';
import streamingService from '../services/streamingService';
import authService from '../services/authService';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Sparkles, Play, Square,
  AlertCircle, Camera, Cloud, Share2, Server, Layout, Image as ImageIcon,
  Globe, Settings, Disc, Download, LogOut, User as UserIcon, Menu, Wifi, ChevronRight, ChevronDown
} from 'lucide-react';

interface StudioProps {
    onLogout: () => void;
    user: User;
}

const Studio: React.FC<StudioProps> = ({ onLogout, user }) => {
  // --- Plan Limits Logic ---
  const getPlanLimits = (plan: UserPlan) => {
      switch (plan) {
          case 'always_free': return { maxDest: 1, allowCloud: false, showWatermark: true, label: 'Free Tier', cloudHours: 0 };
          case 'free_trial': return { maxDest: 99, allowCloud: true, showWatermark: false, label: 'Free Trial', cloudHours: 5 };
          case 'creator': return { maxDest: 3, allowCloud: true, showWatermark: false, label: 'Creator', cloudHours: 2 };
          case 'pro': return { maxDest: 99, allowCloud: true, showWatermark: false, label: 'Pro Plan', cloudHours: 5 };
          case 'business': return { maxDest: 99, allowCloud: true, showWatermark: false, label: 'Business', cloudHours: 50 };
          case 'admin': return { maxDest: 999, allowCloud: true, showWatermark: false, label: 'Admin', cloudHours: Infinity };
          default: return { maxDest: 1, allowCloud: false, showWatermark: true, label: 'Free', cloudHours: 0 };
      }
  };

  const planLimits = getPlanLimits(user.plan);

  // --- State ---
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [streamMode, setStreamMode] = useState<StreamMode>('local');
  
  const [layout, setLayout] = useState<LayoutMode>(LayoutMode.FULL_CAM);
  const [appState, setAppState] = useState<AppState>({
    isStreaming: false,
    isRecording: false,
    streamDuration: 0,
    recordingDuration: 0
  });

  const [mixerState, setMixerState] = useState<AudioMixerState>({
      micVolume: 1,
      musicVolume: 0.3,
      videoVolume: 0.8
  });

  // Mobile Navigation State
  const [activeMobileTab, setActiveMobileTab] = useState<'studio' | 'media' | 'destinations'>('studio');
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  // Notifications
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
      email: '',
      phone: '',
      notifyOnLive: true,
      notifyOnCountdown: false
  });
  const [showNotificationToast, setShowNotificationToast] = useState<string | null>(null);

  // Cloud Import
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // Onboarding & Pre-stream
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show onboarding for new users (check localStorage)
    const hasSeenOnboarding = localStorage.getItem('streamhub_onboarding_completed');
    return !hasSeenOnboarding;
  });
  const [showPreStreamConfirm, setShowPreStreamConfirm] = useState(false);

  // ChatScreamer state
  const [chatScreamerMessage, setChatScreamerMessage] = useState<ChatScreamerMessage | null>(null);

  // Media Streams
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamMuted, setIsCamMuted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Media Bin Assets
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  // AI Content
  const [streamTopic, setStreamTopic] = useState('');
  const [generatedInfo, setGeneratedInfo] = useState<{title: string, description: string, hashtags: string[]} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs
  const canvasRef = useRef<CanvasRef>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const musicNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const videoNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const videoGainRef = useRef<GainNode | null>(null);

  // --- AUDIO ENGINE INIT ---
  useEffect(() => {
      if (!audioCtxRef.current) {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          if (Ctx) {
              const ctx = new Ctx();
              audioCtxRef.current = ctx;
              
              // Master Destination (The "Stream" Audio)
              const dest = ctx.createMediaStreamDestination();
              destNodeRef.current = dest;

              // Music Player Setup
              const audioEl = audioPlayerRef.current;
              audioEl.crossOrigin = "anonymous";
              audioEl.loop = true;
              try {
                  const source = ctx.createMediaElementSource(audioEl);
                  const gain = ctx.createGain();
                  source.connect(gain);
                  gain.connect(dest); // To Stream
                  gain.connect(ctx.destination); // To Speakers (Monitor)
                  musicNodeRef.current = source;
                  musicGainRef.current = gain;
              } catch (e) {
                  console.warn("Audio source already connected", e);
              }
          }
      }
  }, []);

  // Update Volumes
  useEffect(() => {
      if (micGainRef.current) micGainRef.current.gain.value = isMicMuted ? 0 : mixerState.micVolume;
      if (musicGainRef.current) musicGainRef.current.gain.value = mixerState.musicVolume;
      if (videoGainRef.current) videoGainRef.current.gain.value = mixerState.videoVolume;
  }, [mixerState, isMicMuted]);

  // Connect Microphone to Mixer
  useEffect(() => {
      if (cameraStream && audioCtxRef.current && destNodeRef.current) {
          const ctx = audioCtxRef.current;
          // Clean up old mic connection
          if (micNodeRef.current) micNodeRef.current.disconnect();

          try {
             // Create new mic source
             const source = ctx.createMediaStreamSource(cameraStream);
             const gain = ctx.createGain();
             gain.gain.value = isMicMuted ? 0 : mixerState.micVolume;
             
             source.connect(gain);
             gain.connect(destNodeRef.current); // Connect to Stream Destination Only (Don't monitor mic to avoid echo)
             
             micNodeRef.current = source;
             micGainRef.current = gain;
          } catch(e) {
              console.error("Mic connection error", e);
          }
      }
  }, [cameraStream]);

  // Connect Canvas Video Element to Mixer
  useEffect(() => {
      const timer = setTimeout(() => {
          if (canvasRef.current && audioCtxRef.current && destNodeRef.current && !videoNodeRef.current) {
              const videoEl = canvasRef.current.getVideoElement();
              if (videoEl) {
                  try {
                      const ctx = audioCtxRef.current;
                      const source = ctx.createMediaElementSource(videoEl);
                      const gain = ctx.createGain();
                      gain.gain.value = mixerState.videoVolume;
                      
                      source.connect(gain);
                      gain.connect(destNodeRef.current); // To Stream
                      gain.connect(ctx.destination); // To Speakers (Monitor)

                      videoNodeRef.current = source;
                      videoGainRef.current = gain;
                  } catch (e) {
                      console.warn("Video Element Source create error", e);
                  }
              }
          }
      }, 2000);
      return () => clearTimeout(timer);
  }, []);

  // --- Handlers ---
  const toggleCamera = async () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
        setIsCamMuted(true);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setCameraStream(stream);
            setIsCamMuted(false);
            setIsMicMuted(false);
            setPermissionError(null);
        } catch (err) {
            setPermissionError("Camera access denied. Please check permissions.");
        }
    }
  };

  const toggleScreen = async () => {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
    } else {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setScreenStream(stream);
            setLayout(LayoutMode.FULL_SCREEN);
        } catch (err) {
            console.warn("Screen share cancelled");
        }
    }
  };

  const handleUpload = (file: File, type: MediaType) => {
    const newAsset: MediaAsset = {
        id: Date.now().toString(),
        type,
        name: file.name,
        url: URL.createObjectURL(file),
        source: 'local'
    };
    setMediaAssets(prev => [...prev, newAsset]);
  };

  const handleCloudImport = (file: { name: string; url: string; type: MediaType }) => {
      const newAsset: MediaAsset = {
          id: Date.now().toString(),
          type: file.type,
          name: file.name,
          url: file.url,
          source: 'cloud'
      };
      setMediaAssets(prev => [...prev, newAsset]);
  };

  const handleDeleteAsset = (id: string) => {
      setMediaAssets(prev => prev.filter(a => a.id !== id));
      if (activeImageId === id) setActiveImageId(null);
      if (activeVideoId === id) setActiveVideoId(null);
      if (activeAudioId === id) setActiveAudioId(null);
  };

  const handleToggleAsset = (id: string, type: MediaType) => {
      if (type === 'image') setActiveImageId(prev => prev === id ? null : id);
      if (type === 'video') setActiveVideoId(prev => prev === id ? null : id);
      if (type === 'audio') setActiveAudioId(prev => prev === id ? null : id);
  };

  // Sync Audio Player with Active Audio Asset
  useEffect(() => {
      const asset = mediaAssets.find(a => a.id === activeAudioId);
      if (asset) {
          audioPlayerRef.current.src = asset.url;
          audioPlayerRef.current.play().catch(console.error);
      } else {
          audioPlayerRef.current.pause();
      }
  }, [activeAudioId, mediaAssets]);


  // --- STREAMING LOGIC ---

  const startBroadcasting = async () => {
      if (!canvasRef.current || !destNodeRef.current) {
          alert("Studio not ready. Please wait a moment.");
          return;
      }

      const activeDestinations = destinations.filter(d => d.isEnabled);
      if (activeDestinations.length === 0) {
          alert("Please add and enable at least one destination (e.g. YouTube) to Go Live.");
          return;
      }

      // 1. Prepare Master Stream (Video + Mixed Audio)
      const canvasStream = canvasRef.current.getStream();
      const audioTrack = destNodeRef.current.stream.getAudioTracks()[0];

      const tracks = [...canvasStream.getVideoTracks()];
      if (audioTrack) tracks.push(audioTrack);

      const masterStream = new MediaStream(tracks);

      // 2. Start MediaRecorder (Records to local blob for verification)
      recordedChunksRef.current = [];
      try {
          const recorder = new MediaRecorder(masterStream, { mimeType: 'video/webm; codecs=vp9' });
          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) recordedChunksRef.current.push(e.data);
          };
          recorder.start(1000); // chunk every 1s
          mediaRecorderRef.current = recorder;
      } catch (e) {
          console.error("MediaRecorder failed", e);
          alert("Could not start recording engine. Check browser compatibility.");
          return;
      }

      // 3. Start real streaming to backend
      try {
          setAppState(prev => ({ ...prev, isStreaming: true, streamDuration: 0 }));
          setDestinations(prev => prev.map(d => d.isEnabled ? ({ ...d, status: 'connecting' }) : d));

          const streamResponse = await streamingService.startStream(
              masterStream,
              activeDestinations,
              generatedInfo?.title || 'Untitled Stream',
              generatedInfo?.description || ''
          );

          console.log('Stream started:', streamResponse);

          // Update destination statuses based on backend response
          setDestinations(prev => prev.map(d => {
              const backendDest = streamResponse.destinations.find(bd => bd.platform === d.platform);
              if (backendDest) {
                  return { ...d, status: backendDest.status as any };
              }
              return d;
          }));

          // Start duration timer
          streamIntervalRef.current = setInterval(() => {
              setAppState(prev => ({ ...prev, streamDuration: prev.streamDuration + 1 }));
          }, 1000);

          // Update statuses to 'live' after connection established (3 seconds)
          setTimeout(() => {
              setDestinations(prev => prev.map(d => d.isEnabled ? ({ ...d, status: 'live' }) : d));
              setShowNotificationToast("You are LIVE! Broadcasting to " + activeDestinations.map(d => d.platform).join(', '));
          }, 3000);

      } catch (error: any) {
          console.error('Failed to start stream:', error);
          alert(`Failed to start stream: ${error.message}`);

          // Rollback state
          setAppState(prev => ({ ...prev, isStreaming: false }));
          setDestinations(prev => prev.map(d => ({ ...d, status: 'offline' })));

          // Stop local recording
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
          }
      }
  };

  const stopBroadcasting = async () => {
      try {
          // 1. Stop real streaming
          await streamingService.stopStream();

          // 2. Stop local recorder
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
          }

          // 3. Clear Timer
          if (streamIntervalRef.current) {
              clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = null;
          }

          // 4. UI Updates
          setAppState(prev => ({ ...prev, isStreaming: false }));
          setDestinations(prev => prev.map(d => ({ ...d, status: 'offline' })));

          // 5. Trigger Download (Verification)
          setTimeout(() => {
              const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = `streamhub-recording-${new Date().toISOString()}.webm`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              setShowNotificationToast("Stream Ended. Recording downloaded for verification.");
          }, 500);

      } catch (error: any) {
          console.error('Error stopping stream:', error);
          alert(`Error stopping stream: ${error.message}`);
      }
  };

  const toggleStreaming = () => {
      if (appState.isStreaming) {
          if (confirm("Are you sure you want to end the stream?")) {
              stopBroadcasting();
          }
      } else {
          // Show pre-stream confirmation instead of starting immediately
          setShowPreStreamConfirm(true);
      }
  };

  const handleOnboardingComplete = () => {
      localStorage.setItem('streamhub_onboarding_completed', 'true');
      setShowOnboarding(false);
  };

  const handleGenerateMetadata = async () => {
      if (!streamTopic) return;
      setIsGenerating(true);
      const data = await generateStreamMetadata(streamTopic);
      setGeneratedInfo(data);
      setIsGenerating(false);
  };

  const activeImageUrl = mediaAssets.find(a => a.id === activeImageId)?.url || null;
  const activeVideoUrl = mediaAssets.find(a => a.id === activeVideoId)?.url || null;

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* --- HEADER --- */}
      <header className="h-16 bg-dark-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-1.5 rounded-lg">
                <Sparkles size={18} fill="white" />
            </div>
            <h1 className="font-bold text-lg hidden md:block">StreamHub<span className="text-brand-400">Pro</span></h1>
            <div className="bg-dark-800 px-2 py-1 rounded text-xs text-gray-400 border border-gray-700">
                {planLimits.label}
            </div>
        </div>

        {appState.isStreaming && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-900/20 border border-red-500/50 px-4 py-1 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-400 font-mono font-bold text-sm">
                    {new Date(appState.streamDuration * 1000).toISOString().substr(11, 8)}
                </span>
            </div>
        )}

        <div className="flex-1 max-w-xl mx-4 hidden md:flex gap-2 justify-end md:justify-center">
             {!appState.isStreaming && (
                <div className="relative w-full max-w-md">
                    <input 
                        type="text"
                        value={streamTopic}
                        onChange={(e) => setStreamTopic(e.target.value)}
                        placeholder="Enter topic for AI generation..."
                        className="w-full bg-dark-800 border border-gray-700 rounded-lg pl-3 pr-10 py-1.5 text-sm focus:border-brand-500 outline-none transition-all"
                    />
                    <button 
                        onClick={handleGenerateMetadata}
                        disabled={isGenerating || !streamTopic}
                        className="absolute right-1 top-1 p-1 text-brand-400 hover:text-white disabled:opacity-50"
                    >
                        <Sparkles size={16} />
                    </button>
                </div>
             )}
        </div>

        <div className="flex items-center gap-3">
             <button onClick={() => setShowMobileSettings(!showMobileSettings)} className="md:hidden p-2 text-gray-400 hover:text-white">
                 <Settings size={20} />
             </button>
             <div className="hidden md:flex items-center gap-2">
                 <div className="text-right">
                     <div className="text-sm font-bold">{user.name}</div>
                     <div className="text-xs text-gray-500">{user.email}</div>
                 </div>
                 <div className="w-8 h-8 bg-brand-900 rounded-full flex items-center justify-center border border-brand-500 text-brand-400 font-bold">
                     {user.name.charAt(0)}
                 </div>
                 <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-500" title="Logout">
                     <LogOut size={18} />
                 </button>
             </div>
        </div>
      </header>

      {/* --- NOTIFICATION TOAST --- */}
      {showNotificationToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-brand-900 text-white px-6 py-3 rounded-full shadow-2xl border border-brand-500 flex items-center gap-2 animate-fade-in-down">
              <Wifi size={16} className="text-brand-400 animate-pulse" />
              <span className="text-sm font-bold">{showNotificationToast}</span>
              <button onClick={() => setShowNotificationToast(null)} className="ml-2 hover:text-brand-300"><Square size={10}/></button>
          </div>
      )}

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR (Destinations) - Desktop */}
        <aside className={`w-80 bg-dark-900 border-r border-gray-800 flex-col z-10 ${activeMobileTab === 'destinations' ? 'flex absolute inset-0 md:static w-full' : 'hidden md:flex'}`}>
            <div className="flex-1 overflow-hidden p-2">
                <DestinationManager 
                    destinations={destinations}
                    onAddDestination={(d) => setDestinations(prev => [...prev, d])}
                    onRemoveDestination={(id) => setDestinations(prev => prev.filter(d => d.id !== id))}
                    onToggleDestination={(id) => setDestinations(prev => prev.map(d => d.id === id ? {...d, isEnabled: !d.isEnabled} : d))}
                    isStreaming={appState.isStreaming}
                    planLimit={planLimits.maxDest}
                />
            </div>
            <NotificationPanel 
                config={notificationConfig}
                onUpdate={setNotificationConfig}
            />
        </aside>

        {/* CENTER (Canvas & Controls) */}
        <main className={`flex-1 flex flex-col min-w-0 bg-black relative ${activeMobileTab === 'studio' ? 'flex' : 'hidden md:flex'}`}>
            
            {/* AI Generated Info Toast */}
            {generatedInfo && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
                    <div className="bg-brand-900/90 backdrop-blur border border-brand-500/50 p-4 rounded-xl shadow-2xl animate-fade-in-down relative">
                        <button onClick={() => setGeneratedInfo(null)} className="absolute top-2 right-2 text-brand-300 hover:text-white"><Square size={14}/></button>
                        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                             <Sparkles size={14} className="text-brand-400"/> AI Suggestion
                        </h3>
                        <div className="text-white font-medium mb-1">{generatedInfo.title}</div>
                        <div className="text-xs text-brand-200 mb-2">{generatedInfo.description}</div>
                        <div className="flex flex-wrap gap-1">
                            {generatedInfo.hashtags.map(tag => (
                                <span key={tag} className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-brand-300">{tag}</span>
                            ))}
                        </div>
                        <button 
                            onClick={() => {
                                // Apply logic would go here
                                setGeneratedInfo(null);
                            }}
                            className="mt-2 w-full bg-brand-600 hover:bg-brand-500 text-xs font-bold py-1.5 rounded"
                        >
                            Use This Metadata
                        </button>
                    </div>
                </div>
            )}

            {/* Canvas Area */}
            <div className="flex-1 p-2 md:p-4 flex flex-col relative overflow-hidden">
                <div className="flex-1 relative bg-dark-900 rounded-lg overflow-hidden border border-gray-800 shadow-2xl flex items-center justify-center">
                    {streamMode === 'cloud_vm' ? (
                        <CloudVMManager 
                             isStreaming={appState.isStreaming}
                             onStartCloudStream={(url) => {
                                 toggleStreaming();
                                 // Logic to handoff url to backend would go here
                             }}
                             onStopCloudStream={toggleStreaming}
                             user={user}
                             isLocked={!planLimits.allowCloud}
                        />
                    ) : (
                        <>
                            {permissionError && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                                    <div className="text-center">
                                        <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                                        <p className="text-red-400 font-bold">{permissionError}</p>
                                    </div>
                                </div>
                            )}
                            <CanvasCompositor
                                ref={canvasRef}
                                layout={layout}
                                cameraStream={cameraStream}
                                screenStream={screenStream}
                                activeMediaUrl={activeImageUrl}
                                activeVideoUrl={activeVideoUrl}
                                backgroundUrl={null}
                                showWatermark={planLimits.showWatermark}
                            />
                            {/* ChatScreamer Overlay - renders on top of canvas */}
                            <ChatScreamerOverlay
                                message={chatScreamerMessage}
                                position="center"
                                animation="bounce"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-dark-900 border-t border-gray-800 p-2 md:p-4 flex flex-col gap-4 shrink-0 z-20">
                {/* Top Row Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-2">
                        <button onClick={toggleCamera} className={`p-3 rounded-full transition-all ${cameraStream ? 'bg-gray-700 text-white' : 'bg-red-500/20 text-red-500'}`} title="Toggle Camera">
                            {cameraStream ? <Camera size={20} /> : <VideoOff size={20} />}
                        </button>
                        <button onClick={() => setIsMicMuted(!isMicMuted)} className={`p-3 rounded-full transition-all ${!isMicMuted ? 'bg-gray-700 text-white' : 'bg-red-500/20 text-red-500'}`} title="Toggle Mic">
                            {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button onClick={toggleScreen} className={`p-3 rounded-full transition-all ${screenStream ? 'bg-brand-600 text-white' : 'bg-gray-700 text-gray-400'}`} title="Share Screen">
                            {screenStream ? <Monitor size={20} /> : <MonitorOff size={20} />}
                        </button>
                    </div>

                    <div className="flex-1 flex items-center gap-3 max-w-2xl min-w-[200px]">
                        <AudioMixer mixerState={mixerState} onChange={(k, v) => setMixerState(p => ({...p, [k]: v}))} />
                        {/* ChatScreamer Control Panel */}
                        <ChatScreamer
                            onOverlayMessage={setChatScreamerMessage}
                            isStreaming={appState.isStreaming}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                         <div className="flex bg-dark-800 rounded p-1 border border-gray-700">
                             <button 
                                onClick={() => setStreamMode('local')}
                                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${streamMode === 'local' ? 'bg-brand-600 text-white shadow' : 'text-gray-400'}`}
                             >
                                <Monitor size={14} /> Local
                             </button>
                             <button 
                                onClick={() => setStreamMode('cloud_vm')}
                                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${streamMode === 'cloud_vm' ? 'bg-green-600 text-white shadow' : 'text-gray-400'}`}
                             >
                                <Cloud size={14} /> Cloud VM
                             </button>
                         </div>
                         
                         <button 
                            onClick={toggleStreaming}
                            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 min-w-[140px] justify-center ${appState.isStreaming ? 'bg-red-600 text-white animate-pulse' : 'bg-brand-600 text-white hover:bg-brand-500'}`}
                         >
                            {appState.isStreaming ? <Square size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
                            {appState.isStreaming ? 'END STREAM' : 'GO LIVE'}
                         </button>
                    </div>
                </div>

                {/* Bottom Row Layouts */}
                <div className="flex items-center justify-center md:justify-start overflow-x-auto pb-2 md:pb-0">
                    <LayoutSelector currentLayout={layout} onSelect={setLayout} />
                </div>
            </div>
        </main>

        {/* RIGHT SIDEBAR (Media) - Desktop */}
        <aside className={`w-80 bg-dark-900 border-l border-gray-800 flex-col z-10 ${activeMobileTab === 'media' ? 'flex absolute inset-0 md:static w-full' : 'hidden md:flex'}`}>
            <div className="p-3 border-b border-gray-800">
                 <div className="flex justify-between items-center mb-3">
                   <h2 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2"><ImageIcon size={14}/> Media Assets</h2>
                 </div>
                 {/* Elevated Cloud Import Button */}
                 <button
                   onClick={() => setIsCloudModalOpen(true)}
                   className="w-full bg-gradient-to-r from-brand-900/50 to-purple-900/50 hover:from-brand-800/60 hover:to-purple-800/60 border border-brand-500/40 hover:border-brand-500/60 rounded-lg p-3 flex items-center gap-3 transition-all group"
                 >
                     <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center group-hover:bg-brand-500/30 transition-colors">
                       <Cloud size={20} className="text-brand-400" />
                     </div>
                     <div className="text-left flex-1">
                       <div className="text-sm font-bold text-white">Cloud Import</div>
                       <div className="text-xs text-gray-400">Google Drive, Dropbox, OneDrive...</div>
                     </div>
                     <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                 </button>
            </div>
            <MediaBin 
                assets={mediaAssets}
                activeAssets={{ image: activeImageId, video: activeVideoId, audio: activeAudioId }}
                onUpload={handleUpload}
                onDelete={handleDeleteAsset}
                onToggleAsset={handleToggleAsset}
            />
        </aside>
      </div>

      {/* MOBILE NAV BOTTOM */}
      <nav className="md:hidden h-16 bg-dark-900 border-t border-gray-800 flex justify-around items-center px-2 z-50">
          <button onClick={() => setActiveMobileTab('destinations')} className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'destinations' ? 'text-brand-400' : 'text-gray-500'}`}>
              <Globe size={20} />
              <span className="text-[10px]">Destinations</span>
          </button>
          <button onClick={() => setActiveMobileTab('studio')} className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'studio' ? 'text-brand-400' : 'text-gray-500'}`}>
              <Layout size={20} />
              <span className="text-[10px]">Studio</span>
          </button>
          <button onClick={() => setActiveMobileTab('media')} className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'media' ? 'text-brand-400' : 'text-gray-500'}`}>
              <ImageIcon size={20} />
              <span className="text-[10px]">Media</span>
          </button>
      </nav>

      {/* MODALS */}
      <CloudImportModal
         isOpen={isCloudModalOpen}
         onClose={() => setIsCloudModalOpen(false)}
         onImport={handleCloudImport}
      />

      {/* Onboarding Tour for new users */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

      {/* Pre-stream confirmation modal */}
      <PreStreamConfirmation
        isOpen={showPreStreamConfirm}
        onClose={() => setShowPreStreamConfirm(false)}
        onConfirm={() => {
          setShowPreStreamConfirm(false);
          startBroadcasting();
        }}
        destinations={destinations}
        hasCamera={!!cameraStream}
        hasMic={!isMicMuted && !!cameraStream}
        hasScreen={!!screenStream}
        streamTitle={generatedInfo?.title}
      />
    </div>
  );
};

export default Studio;
