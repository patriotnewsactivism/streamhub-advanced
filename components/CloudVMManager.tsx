
import React, { useState, useEffect } from 'react';
import { CloudVMStats, User } from '../types';
import { Cloud, Server, Wifi, Activity, Zap, Square, Link as LinkIcon, CheckCircle, DollarSign, Settings, BarChart3, Lock } from 'lucide-react';

interface CloudVMManagerProps {
  isStreaming: boolean;
  onStartCloudStream: (url: string) => void;
  onStopCloudStream: () => void;
  user: User;
  isLocked?: boolean; // NEW: Forces lock screen for free tier
}

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
  
  // Local Usage Tracker for Display
  const [currentUsage, setCurrentUsage] = useState(user.cloudHoursUsed);

  // Cost Constants (Approximate Google Cloud Pricing)
  const VM_HOURLY_COST = 0.067; // e2-standard-2
  const EGRESS_COST_PER_GB = 0.085; // Standard Tier

  const isAdmin = user.plan === 'admin';
  const hasReachedLimit = !isAdmin && currentUsage >= user.cloudHoursLimit;

  // Simulate VM Bootup
  useEffect(() => {
    if (!isLocked) {
        const timer = setTimeout(() => setIsBooting(false), 2000);
        return () => clearTimeout(timer);
    } else {
        setIsBooting(false);
    }
  }, [isLocked]);

  // Simulate Live Stats & Cost Calculation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isStreaming) {
      setVmStats(prev => ({ ...prev, status: 'streaming' }));
      interval = setInterval(() => {
        setVmStats(prev => {
          // Calculate Data Used in this second (Bitrate / 8 bits = Bytes)
          const mbitsPerSecond = selectedBitrate / 1024 / 8; // MB per second
          return {
            ...prev,
            bandwidthSaved: prev.bandwidthSaved + mbitsPerSecond,
            serverSpeed: 800 + Math.random() * 200 // Simulate Gigabit cloud connection
          };
        });

        // Calculate Real-time Cost
        setSessionCost(prev => {
            const vmCostPerSec = VM_HOURLY_COST / 3600;
            const dataPerSecGB = (selectedBitrate / 8 / 1024 / 1024); // GB per second
            const egressCostPerSec = dataPerSecGB * EGRESS_COST_PER_GB;
            return prev + vmCostPerSec + egressCostPerSec;
        });

        // Increment Usage (Simulated)
        if (!isAdmin) {
             setCurrentUsage(prev => prev + (1/3600)); // Add 1 second worth of an hour
        }

      }, 1000);
    } else {
      setVmStats(prev => ({ ...prev, status: 'idle', serverSpeed: 0 }));
    }
    return () => clearInterval(interval);
  }, [isStreaming, selectedBitrate, isAdmin]);

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
    // Simulate fetching delay
    setTimeout(() => {
        onStartCloudStream(directLink);
    }, 1500);
  };

  const getQualityLabel = (br: number) => {
      if (br === 4000) return "720p Std";
      if (br === 6000) return "1080p High";
      if (br === 8000) return "1080p Ultra";
      return "";
  };

  // --- LOCKED STATE ---
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
    <div className="w-full h-full bg-slate-900 flex flex-col items-center p-4 md:p-8 relative overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(17,24,39,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      
      <div className="max-w-4xl w-full bg-slate-800/80 backdrop-blur-md border border-brand-500/30 rounded-2xl p-4 md:p-8 shadow-2xl relative z-10 flex flex-col gap-6">
        
        {/* Usage Bar (For Non-Admins) */}
        {!isAdmin && (
             <div className="bg-dark-900 rounded-lg p-3 border border-gray-700">
                 <div className="flex justify-between items-end mb-2">
                     <span className="text-xs text-gray-400 uppercase font-bold">Monthly Cloud Usage</span>
                     <span className="text-xs font-mono text-white">
                         <span className={hasReachedLimit ? "text-red-500" : "text-brand-400"}>{currentUsage.toFixed(2)}</span> / {user.cloudHoursLimit} Hrs
                     </span>
                 </div>
                 <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                     <div 
                        className={`h-full transition-all ${hasReachedLimit ? 'bg-red-500' : 'bg-brand-500'}`} 
                        style={{ width: `${Math.min(100, (currentUsage / user.cloudHoursLimit) * 100)}%` }}
                     ></div>
                 </div>
                 {hasReachedLimit && <div className="text-[10px] text-red-500 mt-1 font-bold">Limit Reached. Please Upgrade.</div>}
             </div>
        )}
        {isAdmin && (
             <div className="bg-brand-900/20 border border-brand-500/20 p-3 rounded-lg text-brand-400 text-xs font-bold text-center uppercase tracking-widest">
                 Admin Mode: Unlimited Cloud Access
             </div>
        )}

        {/* Header Stats */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-700 pb-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 md:p-3 rounded-full ${isStreaming ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
                    <Server size={24} className="md:w-8 md:h-8" />
                </div>
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-white">Cloud Engine</h2>
                    <p className="text-[10px] md:text-xs text-brand-400 font-mono flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                        ONLINE: us-central1-a
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:flex md:gap-8 gap-4">
                 <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><DollarSign size={10}/> Est. Cost</div>
                    <div className="text-lg md:text-2xl font-mono text-white font-bold">${sessionCost.toFixed(4)}</div>
                </div>
                <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><Wifi size={10}/> Saved Data</div>
                    <div className="text-lg md:text-2xl font-mono text-green-400 font-bold">{vmStats.bandwidthSaved.toFixed(1)} MB</div>
                </div>
            </div>
        </div>

        {/* Status Display */}
        {isStreaming ? (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-green-500/30 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-4 border-t-green-500 animate-spin"></div>
                        <Zap size={32} className="text-green-500 md:w-12 md:h-12" fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Streaming Active</h3>
                        <p className="text-gray-400 text-xs md:text-sm">
                           Relaying @ {selectedBitrate} kbps
                        </p>
                    </div>
                    <button 
                        onClick={onStopCloudStream}
                        className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                        <Square size={18} fill="currentColor" /> STOP STREAM
                    </button>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-gray-700 space-y-3">
                     <h4 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2">
                        <Activity size={14} className="text-brand-500" /> VM Telemetry
                     </h4>
                     
                     <div className="space-y-2">
                         <div className="flex justify-between text-xs">
                             <span className="text-gray-500">CPU Usage</span>
                             <span className="text-green-400 font-mono">24%</span>
                         </div>
                         <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-green-500 h-full w-[24%]"></div>
                         </div>
                         
                         <div className="flex justify-between text-xs pt-1">
                             <span className="text-gray-500">Uplink</span>
                             <span className="text-brand-400 font-mono">{Math.floor(vmStats.serverSpeed)} Mbps</span>
                         </div>
                         <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-brand-500 h-full w-[85%]"></div>
                         </div>
                     </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col gap-4">
                <div className="bg-slate-900/80 p-4 rounded-lg border border-gray-700">
                    <label className="block text-xs font-bold text-gray-300 mb-2 uppercase flex items-center gap-2">
                        <LinkIcon size={14} className="text-brand-500" /> 
                        Video Source URL
                    </label>
                    <div className="flex flex-col md:flex-row gap-2">
                        <input 
                            value={directLink}
                            onChange={(e) => setDirectLink(e.target.value)}
                            placeholder="Paste MP4 link..."
                            className="flex-1 bg-black border border-gray-600 rounded-lg px-3 py-3 text-white focus:border-brand-500 outline-none font-mono text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Bitrate Selector */}
                    <div className="p-3 bg-slate-900/50 rounded border border-gray-700/50">
                        <div className="text-[10px] text-gray-500 uppercase flex items-center gap-2 mb-2">
                            <Settings size={10}/> Quality
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
                            <BarChart3 size={10}/> Projected Rate
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
                    {hasReachedLimit ? <Lock size={20} /> : <Cloud size={20} />}
                    {hasReachedLimit ? 'USAGE LIMIT REACHED' : 'START CLOUD VM'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CloudVMManager;
