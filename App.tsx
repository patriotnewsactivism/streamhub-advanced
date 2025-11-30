import React, { useState, useEffect, useRef } from 'react';
import { 
  Destination, 
  LayoutMode, 
  Platform, 
  AppState,
  MediaAsset,
  MediaType,
  NotificationConfig,
  StreamMode
} from './types';
import CanvasCompositor, { CanvasRef } from './components/CanvasCompositor';
import DestinationManager from './components/DestinationManager';
import LayoutSelector from './components/LayoutSelector';
import MediaBin from './components/MediaBin';
import CloudImportModal from './components/CloudImportModal';
import NotificationPanel from './components/NotificationPanel';
import CloudVMManager from './components/CloudVMManager';
import { generateStreamMetadata } from './services/geminiService';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Sparkles, Play, Square, AlertCircle, Camera, Cloud, Share2, Server, Wifi, Layout, Image as ImageIcon, Globe, Menu, X, Settings } from 'lucide-react';

const App = () => {
  // --- State ---
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [streamMode, setStreamMode] = useState<StreamMode>('local');
  
  const [layout, setLayout] = useState<LayoutMode>(LayoutMode.FULL_CAM);
  const [appState, setAppState] = useState<AppState>({
    isStreaming: false,
    isRecording: false,
    streamDuration: 0
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

  // Mode Switching Logic
  useEffect(() => {
      // If switching to Cloud Mode, we can stop the camera to save battery
      if (streamMode === 'cloud_vm') {
          if (cameraStream) {
              cameraStream.getTracks().forEach(t => t.stop());
              setCameraStream(null);
          }
          if (screenStream) {
              screenStream.getTracks().forEach(t => t.stop());
              setScreenStream(null);
          }
      } else {
          // Re-enable camera if switching back to local
          if (!cameraStream) initCam();
      }
  }, [streamMode]);

  // Initial Camera Load
  const initCam = async () => {
    if (streamMode === 'cloud_vm') return; // Don't init cam in cloud mode
    
    setPermissionError(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError("Media devices API is not supported in this browser.");
        return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
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

  const handleNotify = () => {
     if (!notificationConfig.notifyOnLive) return;
     const subject = encodeURIComponent("I'm Live Now!");
     const body = encodeURIComponent(`Watch my stream here! \n\nTitle: ${generatedInfo?.title || 'Live Stream'}\n\nJoin me!`);
     if (notificationConfig.email) {
         window.open(`mailto:${notificationConfig.email}?subject=${subject}&body=${body}`, '_blank');
         setShowNotificationToast('Opening Email Client...');
     } else if (notificationConfig.phone) {
         window.open(`sms:${notificationConfig.phone}?&body=${body}`, '_blank');
         setShowNotificationToast('Opening Messaging App...');
     }
  };

  const toggleStream = () => {
    if (appState.isStreaming) {
      setAppState({ ...appState, isStreaming: false, streamDuration: 0 });
      setDestinations(prev => prev.map(d => ({ ...d, status: 'offline' })));
    } else {
      const enabled = destinations.filter(d => d.isEnabled);
      if (enabled.length === 0) {
        alert("Please add and enable at least one destination.");
        setActiveMobileTab('destinations'); // Switch to destination tab on mobile
        return;
      }
      const missingKeys = enabled.filter(d => !d.streamKey);
      if (missingKeys.length > 0) {
          alert(`Missing stream keys for: ${missingKeys.map(d => d.name).join(', ')}`);
          return;
      }

      setAppState({ ...appState, isStreaming: true });
      handleNotify();
      setDestinations(prev => prev.map(d => d.isEnabled ? { ...d, status: 'live' } : d));
    }
  };

  const toggleScreenShare = async () => {
    if (streamMode === 'cloud_vm') {
        alert("Screen sharing is not available in Cloud Mode.");
        return;
    }
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
        if (layout === LayoutMode.FULL_CAM) setLayout(LayoutMode.PIP);
        stream.getVideoTracks()[0].onended = () => setScreenStream(null);
      } catch (err: any) {
         // Handle error
         console.error(err);
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
      const newAsset: MediaAsset = { id: Date.now().toString(), type, url, name: file.name, source: 'local' };
      setMediaAssets(prev => [...prev, newAsset]);
      if (type === 'image' && !activeImageId) setActiveImageId(newAsset.id);
      if (type === 'video' && !activeVideoId) setActiveVideoId(newAsset.id);
  };

  const handleCloudImport = (file: { name: string; url: string; type: MediaType }) => {
      const newAsset: MediaAsset = { id: Date.now().toString(), type: file.type, url: file.url, name: file.name, source: 'cloud' };
      setMediaAssets(prev => [...prev, newAsset]);
      if (file.type === 'image') setActiveImageId(newAsset.id);
      if (file.type === 'video') setActiveVideoId(newAsset.id);
  };

  const handleToggleAsset = (id: string, type: MediaType) => {
      if (type === 'image') setActiveImageId(prev => prev === id ? null : id);
      else if (type === 'video') {
          setActiveVideoId(prev => prev === id ? null : id);
          if (activeVideoId !== id && layout === LayoutMode.FULL_CAM) setLayout(LayoutMode.FULL_SCREEN);
      } 
      else if (type === 'audio') setActiveAudioId(prev => prev === id ? null : id);
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
    <div className="h-screen w-full bg-dark-900 text-gray-100 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Cloud Modal */}
      <CloudImportModal isOpen={isCloudModalOpen} onClose={() => setIsCloudModalOpen(false)} onImport={handleCloudImport} />

      {/* Toast */}
      {showNotificationToast && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[200] bg-green-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in text-sm whitespace-nowrap">
              <Share2 size={16} /> <span className="font-bold">{showNotificationToast}</span>
          </div>
      )}

      {/* --- MOBILE DRAWERS --- */}
      {/* Media Drawer */}
      <div className={`md:hidden fixed inset-x-0 bottom-[60px] top-16 z-30 bg-dark-900 transform transition-transform duration-300 ${activeMobileTab === 'media' ? 'translate-y-0' : 'translate-y-full'}`}>
           <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-dark-800">
                <h3 className="text-sm font-bold uppercase text-gray-400">Media Library</h3>
                <button onClick={() => setIsCloudModalOpen(true)} className="text-xs bg-brand-600 px-2 py-1 rounded flex items-center gap-1"><Cloud size={12}/> Import</button>
           </div>
           <div className="h-full overflow-y-auto pb-20">
             <MediaBin 
                 assets={mediaAssets} 
                 activeAssets={{ image: activeImageId, video: activeVideoId, audio: activeAudioId }}
                 onUpload={handleMediaUpload} 
                 onDelete={(id) => setMediaAssets(mediaAssets.filter(a => a.id !== id))}
                 onToggleAsset={handleToggleAsset}
             />
           </div>
      </div>

      {/* Destinations Drawer */}
      <div className={`md:hidden fixed inset-x-0 bottom-[60px] top-16 z-30 bg-dark-900 transform transition-transform duration-300 ${activeMobileTab === 'destinations' ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="h-full overflow-y-auto pb-20 p-4">
                <DestinationManager 
                    destinations={destinations}
                    onAddDestination={(d) => setDestinations([...destinations, d])}
                    onRemoveDestination={(id) => setDestinations(destinations.filter(d => d.id !== id))}
                    onToggleDestination={(id) => setDestinations(destinations.map(d => d.id === id ? {...d, isEnabled: !d.isEnabled} : d))}
                    isStreaming={appState.isStreaming}
                />
            </div>
      </div>

       {/* Settings Drawer (Mobile) */}
       {showMobileSettings && (
           <div className="md:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur">
               <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center text-white">
                        <h2 className="text-xl font-bold">Stream Settings</h2>
                        <button onClick={() => setShowMobileSettings(false)}><X/></button>
                    </div>
                    {/* Mode Toggle */}
                    <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
                        <label className="text-gray-400 text-xs font-bold uppercase mb-3 block">Stream Engine</label>
                        <div className="flex gap-2">
                            <button onClick={() => setStreamMode('local')} className={`flex-1 py-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 ${streamMode === 'local' ? 'bg-brand-600 text-white' : 'bg-dark-900 text-gray-400'}`}>
                                <Camera size={20}/> Local Studio
                            </button>
                            <button onClick={() => setStreamMode('cloud_vm')} className={`flex-1 py-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 ${streamMode === 'cloud_vm' ? 'bg-green-600 text-white' : 'bg-dark-900 text-gray-400'}`}>
                                <Server size={20}/> Cloud VM
                            </button>
                        </div>
                    </div>
                    {/* AI Tools */}
                    <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
                        <label className="text-gray-400 text-xs font-bold uppercase mb-3 block">AI Assistant</label>
                        <input className="w-full bg-dark-900 p-3 rounded mb-2 text-sm text-white" placeholder="Topic..." value={streamTopic} onChange={e => setStreamTopic(e.target.value)} />
                        <button onClick={handleGenerateAI} className="w-full bg-indigo-600 py-2 rounded text-sm text-white font-bold">{isGenerating ? 'Thinking...' : 'Generate Metadata'}</button>
                    </div>
                    {/* Notifications */}
                    <NotificationPanel config={notificationConfig} onUpdate={setNotificationConfig} />
               </div>
           </div>
       )}


      {/* --- DESKTOP LEFT SIDEBAR (Hidden on Mobile) --- */}
      <aside className="hidden md:flex w-80 flex-col bg-dark-900 border-r border-gray-800 overflow-hidden shrink-0 z-10">
            <div className="p-4 border-b border-gray-800 bg-dark-800">
                <div className="flex items-center gap-2 mb-4">
                     <div className="bg-brand-600 p-1.5 rounded"><Monitor size={18} className="text-white"/></div>
                     <span className="font-bold text-lg tracking-tight">StreamHub<span className="text-brand-500">Pro</span></span>
                </div>
                {/* Mode Toggle Desktop */}
                <div className="flex bg-dark-900 p-1 rounded-lg border border-gray-700">
                    <button onClick={() => setStreamMode('local')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-2 ${streamMode === 'local' ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                        <Camera size={14} /> LOCAL
                    </button>
                    <button onClick={() => setStreamMode('cloud_vm')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-2 ${streamMode === 'cloud_vm' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                        <Server size={14} /> CLOUD
                    </button>
                </div>
            </div>

            {/* AI Assistant Desktop */}
            <div className="p-4 border-b border-gray-800 shrink-0">
                <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-400"/> AI Metadata
                </h3>
                <div className="space-y-2">
                    <input className="w-full bg-dark-800 border border-gray-700 rounded p-2 text-xs text-white outline-none" placeholder="Topic..." value={streamTopic} onChange={(e) => setStreamTopic(e.target.value)}/>
                    <button onClick={handleGenerateAI} disabled={isGenerating || !streamTopic} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded font-bold">{isGenerating ? 'Generating...' : 'Generate'}</button>
                    {generatedInfo && (
                        <div className="bg-indigo-900/20 p-2 rounded border border-indigo-500/30 text-xs">
                            <div className="font-bold text-indigo-300 truncate">{generatedInfo.title}</div>
                            <div className="flex flex-wrap gap-1 mt-1">{generatedInfo.hashtags.slice(0,3).map(tag => <span key={tag} className="bg-indigo-500/30 px-1 rounded text-[10px]">{tag}</span>)}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Media Bin Desktop */}
            <div className={`flex-1 overflow-hidden flex flex-col relative ${streamMode === 'cloud_vm' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="px-4 py-2 bg-dark-800 border-b border-gray-700 font-bold text-xs text-gray-400 uppercase flex justify-between items-center">
                    Assets <button onClick={() => setIsCloudModalOpen(true)} className="text-[10px] bg-dark-700 hover:bg-dark-600 px-2 py-0.5 rounded flex items-center gap-1 text-blue-400"><Cloud size={10} /> Cloud Import</button>
                </div>
                <MediaBin assets={mediaAssets} activeAssets={{ image: activeImageId, video: activeVideoId, audio: activeAudioId }} onUpload={handleMediaUpload} onDelete={(id) => setMediaAssets(mediaAssets.filter(a => a.id !== id))} onToggleAsset={handleToggleAsset}/>
            </div>
      </aside>

      {/* --- CENTER MAIN STAGE --- */}
      <main className="flex-1 flex flex-col relative bg-black min-w-0">
         {/* Mobile Header */}
         <header className="md:hidden h-14 bg-dark-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0 z-20">
             <div className="flex items-center gap-2">
                 <div className="bg-brand-600 p-1 rounded"><Monitor size={16} className="text-white"/></div>
                 <span className="font-bold text-white tracking-tight">StreamHub</span>
             </div>
             <div className="flex items-center gap-3">
                 {appState.isStreaming && <div className="text-red-500 font-mono text-xs font-bold animate-pulse">{formatTime(appState.streamDuration)}</div>}
                 <button onClick={() => setShowMobileSettings(true)} className="text-gray-400 hover:text-white"><Settings size={20}/></button>
                 <button onClick={toggleStream} className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${appState.isStreaming ? 'bg-red-600 text-white' : 'bg-brand-600 text-white'}`}>
                    {appState.isStreaming ? 'END' : 'GO LIVE'}
                 </button>
             </div>
         </header>

         {/* Content Area */}
         <div className="flex-1 flex flex-col md:p-6 overflow-hidden relative">
            {streamMode === 'cloud_vm' ? (
                <CloudVMManager isStreaming={appState.isStreaming} onStartCloudStream={(url) => { console.log("Cloud URL:", url); toggleStream(); }} onStopCloudStream={toggleStream} />
            ) : (
                <>
                    {/* Canvas Stage - Responsive Container */}
                    <div className="w-full flex-1 md:bg-dark-900/50 md:rounded-2xl md:border md:border-gray-800 flex items-center justify-center relative overflow-hidden bg-black p-0 md:p-8">
                        {/* Aspect Ratio Wrapper */}
                        <div className="w-full aspect-video max-h-full mx-auto relative shadow-2xl">
                             <CanvasCompositor 
                                ref={canvasRef}
                                layout={layout}
                                cameraStream={cameraStream}
                                screenStream={screenStream}
                                activeMediaUrl={activeImageUrl}
                                activeVideoUrl={activeVideoUrl}
                                backgroundUrl={null}
                                isLowDataMode={streamMode === 'cloud_vm'} 
                            />
                            {/* Permission Error Overlay */}
                            {(!cameraStream && permissionError) && (
                                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                    <div className="bg-dark-800 p-6 rounded-xl border border-red-500/50 text-center">
                                        <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
                                        <p className="text-gray-300 text-sm mb-4">{permissionError}</p>
                                        <button onClick={initCam} className="bg-brand-600 text-white px-4 py-2 rounded font-bold text-sm">Enable Camera</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls Deck - Desktop & Mobile Hybrid */}
                    <div className="bg-dark-800 border-t border-gray-700 p-2 md:p-4 md:rounded-xl md:mb-0 md:mx-6 md:-mt-6 z-10 shrink-0">
                         <div className="flex flex-col md:flex-row items-center gap-4">
                             {/* Primary Toggles */}
                             <div className="flex items-center gap-4 w-full md:w-auto justify-center md:border-r md:border-gray-600 md:pr-6">
                                <button onClick={toggleMic} disabled={!cameraStream} className={`p-3 md:p-4 rounded-full transition-all ${isMicMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'}`}>
                                    {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <button onClick={toggleCam} disabled={!cameraStream} className={`p-3 md:p-4 rounded-full transition-all ${isCamMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'}`}>
                                    {isCamMuted ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                                <button onClick={toggleScreenShare} className={`hidden md:block p-4 rounded-full transition-all ${screenStream ? 'bg-brand-600 text-white' : 'bg-gray-700 text-white'}`}>
                                    {screenStream ? <MonitorOff size={20} /> : <Monitor size={20} />}
                                </button>
                             </div>
                             
                             {/* Layout Selector */}
                             <div className="w-full md:flex-1 overflow-x-auto">
                                 <LayoutSelector currentLayout={layout} onSelect={setLayout} />
                             </div>

                             {/* Desktop Go Live Button (Hidden Mobile) */}
                             <div className="hidden md:flex items-center gap-4 pl-4 border-l border-gray-600">
                                {appState.isStreaming && <div className="text-red-500 font-mono font-bold animate-pulse">{formatTime(appState.streamDuration)}</div>}
                                <button onClick={toggleStream} className={`px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 ${appState.isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-500'}`}>
                                    {appState.isStreaming ? <Square size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" />}
                                    {appState.isStreaming ? 'END STREAM' : 'GO LIVE'}
                                </button>
                             </div>
                         </div>
                    </div>
                </>
            )}
         </div>

         {/* Mobile Bottom Navigation */}
         <nav className="md:hidden h-[60px] bg-dark-900 border-t border-gray-800 flex items-center justify-around z-40 relative">
             <button onClick={() => { setActiveMobileTab('studio'); }} className={`flex flex-col items-center gap-1 ${activeMobileTab === 'studio' ? 'text-brand-500' : 'text-gray-500'}`}>
                 <Layout size={20} />
                 <span className="text-[10px] font-bold">Studio</span>
             </button>
             <button onClick={() => { setActiveMobileTab('media'); }} className={`flex flex-col items-center gap-1 ${activeMobileTab === 'media' ? 'text-brand-500' : 'text-gray-500'}`}>
                 <ImageIcon size={20} />
                 <span className="text-[10px] font-bold">Media</span>
             </button>
             <button onClick={() => { setActiveMobileTab('destinations'); }} className={`flex flex-col items-center gap-1 ${activeMobileTab === 'destinations' ? 'text-brand-500' : 'text-gray-500'}`}>
                 <Globe size={20} />
                 <span className="text-[10px] font-bold">Destinations</span>
             </button>
         </nav>
      </main>

      {/* --- DESKTOP RIGHT SIDEBAR (Hidden Mobile) --- */}
      <aside className="hidden md:flex w-80 bg-dark-900 border-l border-gray-800 flex-col overflow-hidden shrink-0">
          <NotificationPanel config={notificationConfig} onUpdate={setNotificationConfig} />
          <div className="flex-1 overflow-y-auto p-4">
              <DestinationManager 
                destinations={destinations}
                onAddDestination={(d) => setDestinations([...destinations, d])}
                onRemoveDestination={(id) => setDestinations(destinations.filter(d => d.id !== id))}
                onToggleDestination={(id) => setDestinations(destinations.map(d => d.id === id ? {...d, isEnabled: !d.isEnabled} : d))}
                isStreaming={appState.isStreaming}
            />
          </div>
      </aside>

    </div>
  );
};

export default App;