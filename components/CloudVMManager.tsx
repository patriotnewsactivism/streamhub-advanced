import React, { useState, useEffect } from 'react';
import { CloudVMStats, MediaAsset, MediaType } from '../types';
import { Cloud, Server, Wifi, Activity, Zap, Play, Square, Link as LinkIcon, Download, CheckCircle } from 'lucide-react';

interface CloudVMManagerProps {
  isStreaming: boolean;
  onStartCloudStream: (url: string) => void;
  onStopCloudStream: () => void;
}

const CloudVMManager: React.FC<CloudVMManagerProps> = ({ isStreaming, onStartCloudStream, onStopCloudStream }) => {
  const [vmStats, setVmStats] = useState<CloudVMStats>({
    status: 'idle',
    bandwidthSaved: 0,
    serverSpeed: 0,
  });
  const [directLink, setDirectLink] = useState('');
  const [isBooting, setIsBooting] = useState(true);

  // Simulate VM Bootup
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate Live Stats
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isStreaming) {
      setVmStats(prev => ({ ...prev, status: 'streaming' }));
      interval = setInterval(() => {
        setVmStats(prev => ({
          ...prev,
          bandwidthSaved: prev.bandwidthSaved + (Math.random() * 5), // Simulate saving ~5MB per second
          serverSpeed: 800 + Math.random() * 200 // Simulate Gigabit cloud connection
        }));
      }, 1000);
    } else {
      setVmStats(prev => ({ ...prev, status: 'idle', serverSpeed: 0 }));
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleStart = () => {
    if (!directLink) return;
    setVmStats(prev => ({ ...prev, status: 'fetching' }));
    // Simulate fetching delay
    setTimeout(() => {
        onStartCloudStream(directLink);
    }, 1500);
  };

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
    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(17,24,39,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      
      <div className="max-w-3xl w-full bg-slate-800/50 backdrop-blur-md border border-brand-500/30 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Header Stats */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-6">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isStreaming ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
                    <Server size={32} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Cloud Stream Engine</h2>
                    <p className="text-xs text-brand-400 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                        VM ONLINE: us-central1-a
                    </p>
                </div>
            </div>

            <div className="flex gap-6 text-right">
                <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Mobile Data Saved</div>
                    <div className="text-2xl font-mono text-green-400 font-bold">{vmStats.bandwidthSaved.toFixed(1)} MB</div>
                </div>
                <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Cloud Uplink</div>
                    <div className="text-2xl font-mono text-brand-400 font-bold flex items-center justify-end gap-1">
                        {isStreaming ? Math.floor(vmStats.serverSpeed) : 0} <span className="text-sm">Mbps</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Status Display */}
        {isStreaming ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-32 h-32 rounded-full border-4 border-green-500/30 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-t-green-500 animate-spin"></div>
                    <Zap size={48} className="text-green-500" fill="currentColor" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Streaming Active</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        The cloud server is currently handling 100% of the video processing. 
                        Your phone is in <span className="text-green-400 font-bold">Low Power Mode</span>.
                    </p>
                </div>
                <button 
                    onClick={onStopCloudStream}
                    className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-red-900/50"
                >
                    <Square size={18} fill="currentColor" /> STOP CLOUD STREAM
                </button>
            </div>
        ) : (
            <div className="space-y-6">
                <div className="bg-slate-900/80 p-6 rounded-lg border border-gray-700">
                    <label className="block text-sm font-bold text-gray-300 mb-3 uppercase flex items-center gap-2">
                        <LinkIcon size={16} className="text-brand-500" /> 
                        Source Video Link
                    </label>
                    <div className="flex gap-2">
                        <input 
                            value={directLink}
                            onChange={(e) => setDirectLink(e.target.value)}
                            placeholder="Paste link (Dropbox, Drive, S3, or Direct MP4)..."
                            className="flex-1 bg-black border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-brand-500 outline-none font-mono text-sm"
                        />
                        <button 
                            className="bg-gray-700 hover:bg-gray-600 px-4 rounded-lg text-white"
                            title="Check Link"
                        >
                            <CheckCircle size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Wifi size={12} />
                        Link is processed by server. 0MB data usage on device.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/50 rounded border border-gray-700/50">
                        <div className="text-xs text-gray-500 uppercase">Est. Bandwidth Usage</div>
                        <div className="text-lg font-bold text-white">~50 KB/s</div>
                        <div className="text-xs text-green-500">Low Data Mode</div>
                    </div>
                     <div className="p-4 bg-slate-900/50 rounded border border-gray-700/50">
                        <div className="text-xs text-gray-500 uppercase">Encoding Quality</div>
                        <div className="text-lg font-bold text-white">1080p / 60fps</div>
                        <div className="text-xs text-brand-500">Handled by Cloud</div>
                    </div>
                </div>

                <button 
                    onClick={handleStart}
                    disabled={!directLink}
                    className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-900/20 transition-all"
                >
                    <Cloud size={24} /> 
                    START CLOUD STREAM
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CloudVMManager;