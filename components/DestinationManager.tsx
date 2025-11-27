import React, { useState } from 'react';
import { Destination, Platform } from '../types';
import { Trash2, Plus, Youtube, Facebook, Twitch, Globe, ToggleLeft, ToggleRight, Wifi, Info, Link as LinkIcon, CheckCircle, Loader2 } from 'lucide-react';

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
  const [newKey, setNewKey] = useState('');
  
  // "Easy Connect" simulation state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  const handleSimulatedAuth = () => {
    if (!newName) return;
    setIsConnecting(true);
    // Simulate API delay for OAuth
    setTimeout(() => {
        setIsConnecting(false);
        setConnectedAccount(newName); // In real life this comes from the provider
        setNewKey(`live_${Math.random().toString(36).substring(7)}`); // Mock key
    }, 1500);
  };

  const handleAdd = () => {
    if (!newName || !newKey) return;
    const newDest: Destination = {
      id: Date.now().toString(),
      platform: newPlatform,
      name: connectedAccount ? `${newName} (${newPlatform})` : newName,
      streamKey: newKey,
      isEnabled: true,
      status: 'offline',
      connectedAccount: connectedAccount || undefined
    };
    onAddDestination(newDest);
    
    // Reset form
    setNewName('');
    setNewKey('');
    setConnectedAccount(null);
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

  const isOAuthSupported = newPlatform !== Platform.CUSTOM_RTMP;

  return (
    <div className="bg-dark-800 p-4 rounded-lg border border-gray-700 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Wifi size={20} /> Destinations
        </h2>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="text-xs bg-brand-600 hover:bg-brand-500 px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      <div className="mb-4 bg-brand-900/30 p-2 rounded border border-brand-500/20 text-xs text-gray-300 flex gap-2">
         <Info size={16} className="text-brand-400 shrink-0" />
         <p>Add multiple accounts (e.g. Personal vs Business) to multicast everywhere simultaneously.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {showAddForm && (
          <div className="bg-gray-800 p-3 rounded border border-gray-600 mb-3 animate-fade-in">
            <h3 className="text-xs font-semibold mb-3 text-gray-400">CONNECT NEW ACCOUNT</h3>
            
            <label className="block text-xs text-gray-500 mb-1">Platform</label>
            <select 
              value={newPlatform} 
              onChange={(e) => {
                  setNewPlatform(e.target.value as Platform);
                  setConnectedAccount(null);
                  setNewKey('');
              }}
              className="w-full bg-dark-900 border border-gray-700 rounded p-2 mb-3 text-sm text-white"
            >
              {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <label className="block text-xs text-gray-500 mb-1">Account Label</label>
            <input 
              type="text" 
              placeholder={isOAuthSupported ? "e.g. My Personal Channel" : "Custom Server Name"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={!!connectedAccount}
              className="w-full bg-dark-900 border border-gray-700 rounded p-2 mb-3 text-sm text-white disabled:opacity-50"
            />

            {isOAuthSupported ? (
                <div className="mb-3">
                    {!connectedAccount ? (
                         <button 
                            onClick={handleSimulatedAuth}
                            disabled={!newName || isConnecting}
                            className="w-full py-2 bg-[#4285F4] hover:bg-[#3367D6] rounded text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            {isConnecting ? <Loader2 className="animate-spin" size={16}/> : <LinkIcon size={16} />}
                            {isConnecting ? 'Connecting...' : `Sign in with ${newPlatform}`}
                         </button>
                    ) : (
                        <div className="p-2 bg-green-500/20 border border-green-500/50 rounded flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle size={16} />
                            Connected: <strong>{newName}</strong>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mb-3">
                    <label className="block text-xs text-gray-500 mb-1">Stream Key</label>
                    <input 
                    type="password" 
                    placeholder="rtmp://..."
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full bg-dark-900 border border-gray-700 rounded p-2 text-sm text-white"
                    />
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
              <button onClick={() => setShowAddForm(false)} className="text-xs text-gray-400 hover:text-white px-2 py-1">Cancel</button>
              <button 
                onClick={handleAdd} 
                disabled={!newKey}
                className="text-xs bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded text-white"
              >
                Save Destination
              </button>
            </div>
          </div>
        )}

        {destinations.length === 0 && !showAddForm && (
          <p className="text-gray-500 text-sm text-center py-4">No destinations connected.</p>
        )}

        {destinations.map(dest => (
          <div key={dest.id} className="flex items-center justify-between bg-dark-900 p-3 rounded border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              {getIcon(dest.platform)}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate max-w-[120px]" title={dest.name}>{dest.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {dest.status === 'live' ? (
                    <span className="text-red-500 font-bold animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 block"></span> 
                        LIVE
                    </span>
                  ) : (
                    <span className="capitalize flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full block ${dest.isEnabled ? 'bg-gray-400' : 'bg-gray-700'}`}></span>
                        {dest.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onToggleDestination(dest.id)}
                disabled={isStreaming} // Cannot toggle during stream
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