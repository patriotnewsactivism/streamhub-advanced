
import React, { useState, useEffect, useRef } from 'react';
import { CloudVMStats, User } from '../types';
import { 
  Cloud, Server, Wifi, Activity, Zap, Square, Link as LinkIcon, 
  CheckCircle, DollarSign, Settings, BarChart3, Lock, Eye, Heart, 
  MessageCircle, Share2, Video, VideoOff, ThumbsUp 
} from 'lucide-react';

interface CloudVMManagerProps {
  isStreaming: boolean;
  onStartCloudStream: (url: string) => void;
  onStopCloudStream: () => void;
  user: User;
  isLocked?: boolean;
}

interface ChatMessage {
    id: string;
    user: string;
    text: string;
    color: string;
}

const MOCK_COMMENTS = [
    "Great stream! 🔥", "Hello from Brazil! 🇧🇷", "Audio is crisp today.", 
    "Can you show the chart again?", "Loving the new setup!", "First!!", 
    "Is this live?", "Wow amazing quality 4K", "Keep it up!", "Greeting from Tokyo 🇯🇵"
];

const CloudVMManager: React.FC<CloudVMManagerProps> = ({ isStreaming, onStartCloudStream, onStopCloudStream, user, isLocked = false }) => {
  const [vmStats, setVmStats] = useState<CloudVMStats>({
    status: 'idle',
    bandwidthSaved: 0,
    serverSpeed: 0,
  });
  const [directLink, setDirectLink] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [selectedBitrate, setSelectedBitrate] = useState(6000); // kbps
  const [sessionCost, setSessionCost] = useState(0);
  
  // New State for Preview & Stats
  const [showPreview, setShowPreview] = useState(true); // Default to showing preview
  const [liveViewers, setLiveViewers] = useState(0);
  const [liveLikes, setLiveLikes] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Local Usage Tracker
  const [currentUsage, setCurrentUsage] = useState(user.cloudHoursUsed);

  // Cost Constants
  const VM_HOURLY_COST = 0.067; 
  const EGRESS_COST_PER_GB = 0.085; 

  const isAdmin = user.plan === 'admin';
  const hasReachedLimit = !isAdmin && currentUsage >= user.cloudHoursLimit;

  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Simulate VM Bootup
  useEffect(() => {
    if (!isLocked) {
        const timer = setTimeout(() => setIsBooting(false), 2000);
        return () => clearTimeout(timer);
    } else {
        setIsBooting(false);
    }
  }, [isLocked]);

  // Simulate Live Stats, Cost, Chat
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let chatInterval: ReturnType<typeof setInterval>;

    if (isStreaming) {
      setVmStats(prev => ({ ...prev, status: 'streaming' }));
      
      // Initial Random Stats
      setLiveViewers(Math.floor(Math.random() * 50) + 10);
      setLiveLikes(Math.floor(Math.random() * 20));

      interval = setInterval(() => {
        setVmStats(prev => {
          const mbitsPerSecond = selectedBitrate / 1024 / 8; 
          return {
            ...prev,
            bandwidthSaved: prev.bandwidthSaved + mbitsPerSecond,
            serverSpeed: 800 + Math.random() * 200 
          };
        });

        setSessionCost(prev => {
            const vmCostPerSec = VM_HOURLY_COST / 3600;
            const dataPerSecGB = (selectedBitrate / 8 / 1024 / 1024);
            const egressCostPerSec = dataPerSecGB * EGRESS_COST_PER_GB;
            return prev + vmCostPerSec + egressCostPerSec;
        });

        if (!isAdmin) {
             setCurrentUsage(prev => prev + (1/3600)); 
        }

        // Simulate Live Viewers fluctuation
        setLiveViewers(prev => {
            const change = Math.floor(Math.random() * 5) - 2;
            return Math.max(0, prev + change);
        });

        // Simulate Likes
        if (Math.random() > 0.7) {
            setLiveLikes(prev => prev + 1);
        }

      }, 1000);

      // Chat Simulation
      chatInterval = setInterval(() => {
          if (Math.random() > 0.6) {
              const randomMsg = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
              const randomUser = `User_${Math.floor(Math.random() * 1000)}`;
              const colors = ['text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400'];
              
              setChatMessages(prev => {
                  const newMsg = {
                      id: Date.now().toString(),
                      user: randomUser,
                      text: randomMsg,
                      color: colors[Math.floor(Math.random() * colors.length)]
                  };
                  return [newMsg, ...prev].slice(0, 5); // Keep last 5
              });
          }
      }, 2500);

    } else {
      setVmStats(prev => ({ ...prev, status: 'idle', serverSpeed: 0 }));
      setChatMessages([]);
      setLiveViewers(0);
      setLiveLikes(0);
    }
    return () => {
        clearInterval(interval);
        clearInterval(chatInterval);
    };
  }, [isStreaming, selectedBitrate, isAdmin]);

  // Handle Preview Toggle (Data Saver)
  useEffect(() => {
      if (previewVideoRef.current) {
          if (isStreaming && showPreview && directLink) {
              previewVideoRef.current.src = directLink;
              previewVideoRef.current.play().catch(e => console.log("Auto-play prevented", e));
          } else {
              previewVideoRef.current.pause();
              previewVideoRef.current.src = ""; // Clear source to stop buffering/data usage
          }
      }
  }, [isStreaming, showPreview, directLink]);


  // Force stop if limit reached
  useEffect(() => {
      if (!isAdmin && currentUsage >= user.cloudHoursLimit && isStreaming) {
          onStopCloudStream();
          alert("Cloud Usage Limit Reached. Please upgrade.");
      }
  }, [currentUsage, isStreaming, isAdmin, user.cloudHoursLimit, onStopCloudStream]);

  const handleStart = () => {
    if (!directLink) return;
    if (hasReachedLimit) return;

    setVmStats(prev => ({ ...prev, status: 'fetching' }));
    setTimeout(() => {
        onStartCloudStream(directLink);
    }, 1500);
  };

  const handleShare = async () => {
      const shareData = {
          title: 'Watch my Live Stream',
          text: 'I am streaming live via StreamHub Pro! Watch now.',
          url: 'https://youtube.com/live/example' // Mock URL
      };
      
      try {
          if (navigator.share) {
              await navigator.share(shareData);
          } else {
              alert("Share link copied to clipboard!");
          }
      } catch (err) {
          console.log("Error sharing", err);
      }
  };

  const getQualityLabel = (br: number) => {
      if (br === 4000) return "720p Std";
      if (br === 6000) return "1080p High";
      if (br === 8000) return "1080p Ultra";
      return "";
  };

  if (isLocked) {
      return (
          <div className="w-full h-full flex items-center justify-center p-8 bg-dark-900 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558494949-ef526b0042a0?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
             <div className="relative z-10 bg-dark-800/90 backdrop-blur border border-gray-700 p-8 rounded-2xl max-w-md text-center shadow-2xl">
                 <div className="w-16 h-16 bg-brand-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
                     <Lock size={32} className="text-brand-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Cloud Streaming Locked</h2>
                 <p className="text-gray-400 mb-6">
                     The Cloud Virtual Machine is a premium feature. Upgrade to Pro to save 90% of your mobile data.
                 </p>
                 <button className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold">
                     Upgrade to Pro ($29.99/mo)
                 </button>
             </div>
          </div>
      );
  }

  if (isBooting) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-brand-400 font-mono space-y-4">
        <Server className="animate-pulse" size={48} />
        <div className="text-sm">Initializing Cloud Engine...</div>
        <div className="w-64 h-1 bg-gray-800 rounded overflow-hidden">
            <div className="h-full bg-brand-500 animate-[width_2s_ease-out] w-full origin-left"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col items-center p-4 relative overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(17,24,39,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      
      <div className="max-w-4xl w-full flex-1 flex flex-col gap-4 z-10">
        
        {/* Top Usage Bar */}
        {!isAdmin && (
             <div className="bg-dark-900/80 backdrop-blur rounded-lg p-3 border border-gray-700 shadow-lg">
                 <div className="flex justify-between items-end mb-2">
                     <span className="text-[10px] text-gray-400 uppercase font-bold">Monthly Cloud Usage</span>
                     <span className="text-[10px] font-mono text-white">
                         <span className={hasReachedLimit ? "text-red-500" : "text-brand-400"}>{currentUsage.toFixed(2)}</span> / {user.cloudHoursLimit} Hrs
                     </span>
                 </div>
                 <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                     <div 
                        className={`h-full transition-all ${hasReachedLimit ? 'bg-red-500' : 'bg-brand-500'}`} 
                        style={{ width: `${Math.min(100, (currentUsage / user.cloudHoursLimit) * 100)}%` }}
                     ></div>
                 </div>
             </div>
        )}

        {/* --- STREAMING ACTIVE UI --- */}
        {isStreaming ? (
            <div className="flex-1 flex flex-col md:grid md:grid-cols-3 gap-4 min-h-0">
                
                {/* Main Content Area (Preview or Placeholder) */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    {/* Monitor View */}
                    <div className="relative aspect-video bg-black rounded-xl border border-gray-800 overflow-hidden shadow-2xl group">
                        {showPreview ? (
                            <>
                                <video 
                                    ref={previewVideoRef}
                                    className="w-full h-full object-contain"
                                    playsInline
                                    muted // Mute preview by default to avoid echo
                                    loop
                                    crossOrigin="anonymous"
                                />
                                <div className="absolute top-2 left-2 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1 animate-pulse">
                                    <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
                                </div>
                                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white backdrop-blur">
                                    PREVIEW ON (Data Active)
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-gray-500">
                                <VideoOff size={48} className="mb-2 opacity-50"/>
                                <h3 className="text-lg font-bold text-white">Eco Mode Active</h3>
                                <p className="text-xs">Video preview disabled to save mobile data.</p>
                                <div className="mt-4 px-3 py-1 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-500/30">
                                    Saving ~{(selectedBitrate/8/1024).toFixed(1)} MB/sec
                                </div>
                            </div>
                        )}

                        {/* Hover Controls */}
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => setShowPreview(!showPreview)}
                                className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur border border-gray-600"
                                title={showPreview ? "Disable Preview (Save Data)" : "Enable Preview"}
                            >
                                {showPreview ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-dark-900/60 p-2 rounded border border-gray-700 flex flex-col items-center">
                            <Eye size={16} className="text-brand-400 mb-1" />
                            <span className="text-lg font-bold text-white">{liveViewers}</span>
                            <span className="text-[10px] text-gray-500 uppercase">Viewers</span>
                        </div>
                        <div className="bg-dark-900/60 p-2 rounded border border-gray-700 flex flex-col items-center">
                            <Heart size={16} className="text-red-400 mb-1" />
                            <span className="text-lg font-bold text-white">{liveLikes}</span>
                            <span className="text-[10px] text-gray-500 uppercase">Likes</span>
                        </div>
                        <div className="bg-dark-900/60 p-2 rounded border border-gray-700 flex flex-col items-center">
                            <Wifi size={16} className="text-green-400 mb-1" />
                            <span className="text-lg font-bold text-white">{Math.floor(vmStats.bandwidthSaved)} <span className="text-xs">MB</span></span>
                            <span className="text-[10px] text-gray-500 uppercase">Saved</span>
                        </div>
                         <button 
                            onClick={handleShare}
                            className="bg-brand-600 hover:bg-brand-500 p-2 rounded border border-brand-400 flex flex-col items-center justify-center transition-colors"
                        >
                            <Share2 size={16} className="text-white mb-1" />
                            <span className="text-xs font-bold text-white uppercase">Share</span>
                        </button>
                    </div>
                </div>

                {/* Sidebar Stats & Chat */}
                <div className="flex flex-col gap-4 min-h-0">
                    {/* Telemetry Card */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-gray-700 space-y-3">
                         <h4 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2">
                            <Activity size={14} className="text-brand-500" /> VM Health
                         </h4>
                         
                         <div className="space-y-2">
                             <div className="flex justify-between text-xs">
                                 <span className="text-gray-500">Cost (Session)</span>
                                 <span className="text-white font-mono font-bold">${sessionCost.toFixed(4)}</span>
                             </div>
                             <div className="flex justify-between text-xs pt-1">
                                 <span className="text-gray-500">Uplink Speed</span>
                                 <span className="text-brand-400 font-mono">{Math.floor(vmStats.serverSpeed)} Mbps</span>
                             </div>
                             <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                                 <div className="bg-brand-500 h-full w-[85%] animate-pulse"></div>
                             </div>
                         </div>
                    </div>

                    {/* Chat Feed */}
                    <div className="flex-1 bg-black/40 rounded-xl border border-gray-700 flex flex-col overflow-hidden min-h-[200px]">
                        <div className="p-2 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                             <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                <MessageCircle size={14} /> Live Chat
                             </h4>
                             <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 flex flex-col-reverse">
                            {chatMessages.length === 0 && (
                                <div className="text-center text-gray-600 text-xs py-4">Waiting for chat...</div>
                            )}
                            {chatMessages.map(msg => (
                                <div key={msg.id} className="text-xs animate-fade-in-left">
                                    <span className={`font-bold ${msg.color} mr-2`}>{msg.user}:</span>
                                    <span className="text-gray-300">{msg.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stop Button */}
                     <button 
                        onClick={onStopCloudStream}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/20 transition-all active:scale-95"
                    >
                        <Square size={16} fill="currentColor" /> STOP STREAM
                    </button>
                </div>
            </div>
        ) : (
            // --- IDLE / SETUP UI ---
            <div className="bg-slate-800/80 backdrop-blur-md border border-brand-500/30 rounded-2xl p-4 md:p-8 shadow-2xl flex flex-col gap-6">
                
                <div className="flex items-center gap-3 border-b border-gray-700 pb-4">
                    <div className="p-3 bg-gray-700 rounded-full text-brand-400">
                        <Server size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Cloud Engine Setup</h2>
                        <p className="text-xs text-gray-400">Configure your remote virtual machine.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="bg-slate-900/80 p-4 rounded-lg border border-gray-700">
                        <label className="block text-xs font-bold text-gray-300 mb-2 uppercase flex items-center gap-2">
                            <LinkIcon size={14} className="text-brand-500" /> 
                            Video Source URL (Cloud Direct Link)
                        </label>
                        <div className="flex flex-col md:flex-row gap-2">
                            <input 
                                value={directLink}
                                onChange={(e) => setDirectLink(e.target.value)}
                                placeholder="https://dropbox.com/s/..."
                                className="flex-1 bg-black border border-gray-600 rounded-lg px-3 py-3 text-white focus:border-brand-500 outline-none font-mono text-sm"
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">
                            Supports direct links from Google Drive, Dropbox, S3, or any public MP4/HLS URL.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-900/50 rounded border border-gray-700/50">
                            <div className="text-[10px] text-gray-500 uppercase flex items-center gap-2 mb-2">
                                <Settings size={10}/> Stream Quality
                            </div>
                            <div className="flex gap-2">
                                {[4000, 6000, 8000].map(br => (
                                    <button
                                        key={br}
                                        onClick={() => setSelectedBitrate(br)}
                                        className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded border ${selectedBitrate === br ? 'bg-brand-600 border-brand-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        {br/1000}k
                                    </button>
                                ))}
                            </div>
                            <div className="text-[10px] text-center mt-1 text-gray-400">{getQualityLabel(selectedBitrate)}</div>
                        </div>

                         <div className="p-3 bg-slate-900/50 rounded border border-gray-700/50 flex flex-col justify-center text-center md:text-left">
                            <div className="text-[10px] text-gray-500 uppercase flex items-center justify-center md:justify-start gap-2">
                                <BarChart3 size={10}/> Est. Cloud Cost
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                <span className="text-xl font-bold text-white">~${(VM_HOURLY_COST + ((selectedBitrate / 8 / 1024 / 1024) * 3600 * EGRESS_COST_PER_GB)).toFixed(2)}</span>
                                <span className="text-[10px] text-gray-400">/hr</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleStart}
                        disabled={!directLink || hasReachedLimit}
                        className="w-full py-4 mt-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-900/20 transition-all active:scale-95"
                    >
                        {hasReachedLimit ? <Lock size={20} /> : <Zap size={20} fill="currentColor"/>}
                        {hasReachedLimit ? 'USAGE LIMIT REACHED' : 'START CLOUD STREAM'}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CloudVMManager;
