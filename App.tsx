import React, { useState, useEffect, useRef } from 'react';
import { 
  Destination, 
  LayoutMode, 
  Platform, 
  AppState,
  MediaAsset,
  MediaType,
  NotificationConfig
} from './types';
import CanvasCompositor, { CanvasRef } from './components/CanvasCompositor';
import DestinationManager from './components/DestinationManager';
import LayoutSelector from './components/LayoutSelector';
import MediaBin from './components/MediaBin';
import CloudImportModal from './components/CloudImportModal';
import NotificationPanel from './components/NotificationPanel';
import { generateStreamMetadata } from './services/geminiService';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Sparkles, Play, Square, AlertCircle, Camera, Cloud, Share2 } from 'lucide-react';

const App = () => {
  // --- State ---
  const [destinations, setDestinations] = useState<Destination[]>([
    { id: '1', platform: Platform.YOUTUBE, name: 'Main Channel', streamKey: '****', isEnabled: true, status: 'offline', connectedAccount: 'My Channel' },
  ]);
  
  const [layout, setLayout] = useState<LayoutMode>(LayoutMode.FULL_CAM);
  const [appState, setAppState] = useState<AppState>({
    isStreaming: false,
    isRecording: false,
    streamDuration: 0
  });

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

  const canvasRef = useRef<CanvasRef>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(new Audio());

  // --- Effects ---

  // Audio Player Logic
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (activeAudioId) {
        const asset = mediaAssets.find(a => a.id === activeAudioId);
        if (asset) {
            audio.src = asset.url;
            audio.loop = true;
            audio.volume = 0.3; // Default background volume
            audio.play().catch(e => console.error("Audio play failed", e));
        }
    } else {
        audio.pause();
        audio.src = '';
    }
  }, [activeAudioId, mediaAssets]);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (appState.isStreaming) {
      interval = setInterval(() => {
        setAppState(prev => ({ ...prev, streamDuration: prev.streamDuration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [appState.isStreaming]);

  // Notification Toast Timer
  useEffect(() => {
      if (showNotificationToast) {
          const timer = setTimeout(() => setShowNotificationToast(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [showNotificationToast]);

  // Initial Camera Load
  const initCam = async () => {
    setPermissionError(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError("Media devices API is not supported in this browser.");
        return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStream(stream);
      setIsMicMuted(false);
      setIsCamMuted(false);
    } catch (err: any) {
      console.error("Camera access denied", err);
      let msg = "Could not access camera/microphone.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = "Permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === 'NotFoundError') {
          msg = "No camera or microphone found on this device.";
      } else if (err.name === 'NotReadableError') {
          msg = "Camera/Mic is currently in use by another application.";
      }
      setPermissionError(msg);
    }
  };

  useEffect(() => {
    initCam();
  }, []);

  // --- Handlers ---

  const toggleStream = () => {
    if (appState.isStreaming) {
      // Stop Stream
      setAppState({ ...appState, isStreaming: false, streamDuration: 0 });
      setDestinations(prev => prev.map(d => ({ ...d, status: 'offline' })));
    } else {
      // Start Stream
      const enabled = destinations.filter(d => d.isEnabled);
      if (enabled.length === 0) {
        alert("Please enable at least one destination!");
        return;
      }
      setAppState({ ...appState, isStreaming: true });
      
      // Send Notifications
      if (notificationConfig.notifyOnLive) {
          if (notificationConfig.email || notificationConfig.phone) {
              const methods = [];
              if (notificationConfig.email) methods.push(notificationConfig.email);
              if (notificationConfig.phone) methods.push(notificationConfig.phone);
              setShowNotificationToast(`Broadcasting live link sent to: ${methods.join(', ')}`);
          }
      }

      setDestinations(prev => prev.map(d => d.isEnabled ? { ...d, status: 'connecting' } : d));
      setTimeout(() => {
        setDestinations(prev => prev.map(d => d.isEnabled ? { ...d, status: 'live' } : d));
      }, 2000);
    }
  };

  const toggleScreenShare = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    } else {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          alert("Screen sharing is not supported on this device/browser.");
          return;
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        
        if (layout === LayoutMode.FULL_CAM) {
            setLayout(LayoutMode.PIP);
        }
        
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
        };
      } catch (err: any) {
        console.error("Screen share error", err);
        if (err.name !== 'NotAllowedError' || err.message.includes('permission')) {
             if (err.message.includes('denied by permission policy')) {
                alert("Screen sharing is blocked by the browser's permission policy.");
             } else if (err.name !== 'NotAllowedError') {
                alert("Failed to start screen share. " + err.message);
             }
        }
      }
    }
  };

  const toggleMic = () => {
    if (cameraStream) {
      cameraStream.getAudioTracks().forEach(track => track.enabled = !isMicMuted);
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCam = () => {
    if (cameraStream) {
      cameraStream.getVideoTracks().forEach(track => track.enabled = !isCamMuted);
      setIsCamMuted(!isCamMuted);
    }
  };

  const handleGenerateAI = async () => {
    if (!streamTopic) return;
    setIsGenerating(true);
    const result = await generateStreamMetadata(streamTopic);
    setGeneratedInfo(result);
    setIsGenerating(false);
  };

  const handleMediaUpload = (file: File, type: MediaType) => {
      const url = URL.createObjectURL(file);
      const newAsset: MediaAsset = {
          id: Date.now().toString(),
          type,
          url,
          name: file.name,
          source: 'local'
      };
      setMediaAssets(prev => [...prev, newAsset]);
      
      if (type === 'image' && !activeImageId) setActiveImageId(newAsset.id);
      if (type === 'video' && !activeVideoId) setActiveVideoId(newAsset.id);
  };

  const handleCloudImport = (file: { name: string; url: string; type: MediaType }) => {
      const newAsset: MediaAsset = {
          id: Date.now().toString(),
          type: file.type,
          url: file.url,
          name: file.name,
          source: 'cloud'
      };
      setMediaAssets(prev => [...prev, newAsset]);
      // Auto toggle
      if (file.type === 'image') setActiveImageId(newAsset.id);
      if (file.type === 'video') setActiveVideoId(newAsset.id);
  };

  const handleToggleAsset = (id: string, type: MediaType) => {
      if (type === 'image') {
          setActiveImageId(prev => prev === id ? null : id);
      } else if (type === 'video') {
          setActiveVideoId(prev => prev === id ? null : id);
          if (activeVideoId !== id && layout === LayoutMode.FULL_CAM) {
               setLayout(LayoutMode.FULL_SCREEN);
          }
      } else if (type === 'audio') {
          setActiveAudioId(prev => prev === id ? null : id);
      }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeImageUrl = activeImageId ? mediaAssets.find(a => a.id === activeImageId)?.url || null : null;
  const activeVideoUrl = activeVideoId ? mediaAssets.find(a => a.id === activeVideoId)?.url || null : null;

  return (
    <div className="h-screen w-screen bg-dark-900 text-gray-100 flex flex-col">
      {/* Cloud Modal */}
      <CloudImportModal 
         isOpen={isCloudModalOpen}
         onClose={() => setIsCloudModalOpen(false)}
         onImport={handleCloudImport}
      />

      {/* Notification Toast */}
      {showNotificationToast && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade-in">
              <Share2 size={20} />
              <span className="font-bold">{showNotificationToast}</span>
          </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-dark-800 shrink-0 relative z-50">
        <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-2 rounded-lg">
                <Monitor size={20} className="text-white"/>
            </div>
            <h1 className="text-xl font-bold tracking-tight">StreamHub<span className="text-brand-500">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
            {appState.isStreaming && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/50 rounded text-red-500 font-mono">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {formatTime(appState.streamDuration)}
                </div>
            )}
            <button 
                onClick={toggleStream}
                className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg flex items-center gap-2
                    ${appState.isStreaming 
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-900/50' 
                        : 'bg-brand-600 hover:bg-brand-500 shadow-brand-900/50'
                    }`}
            >
                {appState.isStreaming ? <Square size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" />}
                {appState.isStreaming ? 'END STREAM' : 'GO LIVE'}
            </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Controls & Assets */}
        <aside className="w-80 border-r border-gray-800 bg-dark-900 flex flex-col overflow-hidden">
            
            {/* AI Assistant */}
            <div className="p-4 border-b border-gray-800 shrink-0">
                <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-400"/> AI Studio Assistant
                </h3>
                <div className="space-y-3">
                    <input 
                        className="w-full bg-dark-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-brand-500 outline-none"
                        placeholder="What's your stream about?"
                        value={streamTopic}
                        onChange={(e) => setStreamTopic(e.target.value)}
                    />
                    <button 
                        onClick={handleGenerateAI}
                        disabled={isGenerating || !streamTopic}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? 'Generating...' : 'Generate Metadata'}
                    </button>
                    {generatedInfo && (
                        <div className="bg-indigo-900/20 p-3 rounded border border-indigo-500/30 text-sm animate-fade-in">
                            <div className="font-bold text-indigo-300 mb-1">{generatedInfo.title}</div>
                            <div className="text-xs text-gray-400 mb-2">{generatedInfo.description}</div>
                            <div className="flex flex-wrap gap-1">
                                {generatedInfo.hashtags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-200">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Setup */}
            <NotificationPanel config={notificationConfig} onUpdate={setNotificationConfig} />

            {/* Media Bin */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                <div className="px-4 py-2 bg-dark-800 border-b border-gray-700 font-bold text-xs text-gray-400 uppercase flex justify-between items-center">
                    Media & Overlays
                    <button 
                        onClick={() => setIsCloudModalOpen(true)}
                        className="text-[10px] bg-dark-700 hover:bg-dark-600 px-2 py-0.5 rounded flex items-center gap-1 text-blue-400"
                    >
                        <Cloud size={10} /> Cloud Import
                    </button>
                </div>
                <MediaBin 
                    assets={mediaAssets}
                    activeAssets={{ image: activeImageId, video: activeVideoId, audio: activeAudioId }}
                    onUpload={handleMediaUpload}
                    onDelete={(id) => setMediaAssets(mediaAssets.filter(a => a.id !== id))}
                    onToggleAsset={handleToggleAsset}
                />
            </div>
        </aside>

        {/* Center: Stage */}
        <main className="flex-1 flex flex-col min-w-0 bg-black relative">
            {/* Viewport */}
            <div className="flex-1 p-8 flex items-center justify-center relative bg-[#0a0a0a]">
                 <CanvasCompositor 
                    ref={canvasRef}
                    layout={layout}
                    cameraStream={cameraStream}
                    screenStream={screenStream}
                    activeMediaUrl={activeImageUrl}
                    activeVideoUrl={activeVideoUrl}
                    backgroundUrl={null}
                 />

                 {/* Permission Error Overlay */}
                 {(!cameraStream && permissionError) && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-dark-800 p-6 rounded-xl border border-red-500/50 max-w-md w-full text-center shadow-2xl">
                            <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="text-red-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Camera Access Required</h3>
                            <p className="text-gray-400 mb-6 text-sm">{permissionError}</p>
                            <button 
                                onClick={initCam}
                                className="w-full bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Camera size={18} />
                                Try Again
                            </button>
                        </div>
                    </div>
                 )}
            </div>

            {/* Bottom Control Deck */}
            <div className="h-24 bg-dark-800 border-t border-gray-700 px-8 flex items-center justify-center gap-8 z-10 shrink-0">
                {/* Source Controls */}
                <div className="flex items-center gap-4 mr-8 border-r border-gray-700 pr-8">
                    <button 
                        onClick={toggleMic}
                        disabled={!cameraStream}
                        className={`p-4 rounded-full transition-all ${isMicMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'} ${!cameraStream && 'opacity-50 cursor-not-allowed'}`}
                        title="Toggle Mic"
                    >
                        {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button 
                        onClick={toggleCam}
                        disabled={!cameraStream}
                        className={`p-4 rounded-full transition-all ${isCamMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'} ${!cameraStream && 'opacity-50 cursor-not-allowed'}`}
                        title="Toggle Camera"
                    >
                        {isCamMuted ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                     <button 
                        onClick={toggleScreenShare}
                        className={`p-4 rounded-full transition-all ${screenStream ? 'bg-brand-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                        title="Share Screen"
                    >
                        {screenStream ? <MonitorOff size={24} /> : <Monitor size={24} />}
                    </button>
                </div>

                {/* Layouts */}
                <div className="flex-1 max-w-2xl">
                    <LayoutSelector currentLayout={layout} onSelect={setLayout} />
                </div>
            </div>
        </main>
        
        {/* Right Sidebar: Destinations */}
        <aside className="w-80 border-l border-gray-800 bg-dark-900 flex flex-col overflow-hidden">
            <DestinationManager 
                destinations={destinations}
                onAddDestination={(d) => setDestinations([...destinations, d])}
                onRemoveDestination={(id) => setDestinations(destinations.filter(d => d.id !== id))}
                onToggleDestination={(id) => setDestinations(destinations.map(d => d.id === id ? {...d, isEnabled: !d.isEnabled} : d))}
                isStreaming={appState.isStreaming}
            />
        </aside>
      </div>
    </div>
  );
};

export default App;