import React, { useState } from 'react';
import { Destination, Platform } from '../types';
import { Trash2, Plus, Youtube, Facebook, Twitch, Globe, ToggleLeft, ToggleRight, Wifi, Info, Key, Server, Save, X } from 'lucide-react';

interface DestinationManagerProps {
  destinations: Destination[];
  onAddDestination: (dest: Destination) => void;
  onRemoveDestination: (id: string) => void;
  onToggleDestination: (id: string) => void;
  isStreaming: boolean;
}

const DestinationManager: React.FC<DestinationManagerProps> = ({ 
  destinations, 
  onAddDestination, 
  onRemoveDestination, 
  onToggleDestination,
  isStreaming
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState<Platform>(Platform.YOUTUBE);
  const [newName, setNewName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');

  // Standard RTMP Ingest Endpoints
  const PRESETS: Record<Platform, string> = {
    [Platform.YOUTUBE]: 'rtmp://a.rtmp.youtube.com/live2',
    [Platform.FACEBOOK]: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    [Platform.TWITCH]: 'rtmp://live.twitch.tv/app/',
    [Platform.CUSTOM_RTMP]: ''
  };

  const handlePlatformChange = (p: Platform) => {
    setNewPlatform(p);
    setServerUrl(PRESETS[p]);
  };

  const handleAdd = () => {
    if (!newName || !streamKey) return;
    
    const newDest: Destination = {
      id: Date.now().toString(),
      platform: newPlatform,
      name: newName,
      streamKey: streamKey,
      serverUrl: serverUrl || PRESETS[newPlatform],
      isEnabled: true,
      status: 'offline'
    };
    onAddDestination(newDest);
    
    // Reset form
    setNewName('');
    setStreamKey('');
    setServerUrl('');
    setShowAddForm(false);
  };

  const getIcon = (p: Platform) => {
    switch (p) {
      case Platform.YOUTUBE: return <Youtube className="text-red-500" />;
      case Platform.FACEBOOK: return <Facebook className="text-blue-500" />;
      case Platform.TWITCH: return <Twitch className="text-purple-500" />;
      default: return <Globe className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-dark-800 p-4 rounded-lg border border-gray-700 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Wifi size={20} /> Destinations
        </h2>
        {!showAddForm && (
          <button 
            onClick={() => {
                setShowAddForm(true);
                handlePlatformChange(Platform.YOUTUBE);
            }}
            className="text-xs bg-brand-600 hover:bg-brand-500 px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      <div className="mb-4 bg-blue-900/20 p-3 rounded border border-blue-500/20 text-xs text-blue-200 flex gap-2">
         <Info size={16} className="text-blue-400 shrink-0" />
         <p>Enter your <strong>Stream Key</strong> from your platform's Creator Studio (RTMP Settings).</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {showAddForm && (
          <div className="bg-dark-900 p-4 rounded border border-brand-500/50 mb-3 animate-fade-in shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-white uppercase">New Connection</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white"><X size={14}/></button>
            </div>
            
            <div className="space-y-3">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Platform</label>
                    <select 
                    value={newPlatform} 
                    onChange={(e) => handlePlatformChange(e.target.value as Platform)}
                    className="w-full bg-dark-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-brand-500 outline-none"
                    >
                    {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1">Friendly Name</label>
                    <input 
                    type="text" 
                    placeholder="e.g. My Personal YouTube"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-dark-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-brand-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Server size={10}/> Server URL</label>
                    <input 
                    type="text" 
                    placeholder="rtmp://..."
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="w-full bg-dark-800 border border-gray-700 rounded p-2 text-sm text-gray-300 font-mono focus:border-brand-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Key size={10}/> Stream Key</label>
                    <input 
                    type="password" 
                    placeholder="Paste key here..."
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    className="w-full bg-dark-800 border border-gray-700 rounded p-2 text-sm text-white font-mono focus:border-brand-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-2">
              <button 
                onClick={handleAdd} 
                disabled={!streamKey || !newName}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Save size={14} /> SAVE DESTINATION
              </button>
            </div>
          </div>
        )}

        {destinations.length === 0 && !showAddForm && (
          <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">
              <p className="text-gray-500 text-sm">No destinations configured.</p>
              <p className="text-gray-600 text-xs mt-1">Add a platform to start streaming.</p>
          </div>
        )}

        {destinations.map(dest => (
          <div key={dest.id} className="flex items-center justify-between bg-dark-900 p-3 rounded border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              {getIcon(dest.platform)}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate max-w-[120px] text-gray-200" title={dest.name}>{dest.name}</div>
                <div className="text-[10px] text-gray-500 font-mono truncate max-w-[120px] opacity-70">
                    {dest.serverUrl}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
                {/* Status Indicator */}
               {dest.status === 'live' && (
                    <span className="text-[10px] font-bold text-red-500 animate-pulse border border-red-500/50 px-1 rounded">LIVE</span>
               )}

              <button 
                onClick={() => onToggleDestination(dest.id)}
                disabled={isStreaming} 
                className={`text-gray-400 hover:text-white transition-colors ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={dest.isEnabled ? "Disable" : "Enable"}
              >
                {dest.isEnabled ? <ToggleRight size={24} className="text-brand-500" /> : <ToggleLeft size={24} />}
              </button>
              <button 
                onClick={() => onRemoveDestination(dest.id)}
                disabled={isStreaming}
                className={`text-gray-500 hover:text-red-500 transition-colors ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DestinationManager;