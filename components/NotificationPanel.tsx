import React, { useState } from 'react';
import { NotificationConfig } from '../types';
import { Bell, Mail, Phone, Save, Check } from 'lucide-react';

interface NotificationPanelProps {
  config: NotificationConfig;
  onUpdate: (config: NotificationConfig) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ config, onUpdate }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdate(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-4 bg-dark-800 border-t border-b border-gray-800">
      <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-2">
        <Bell size={14} className="text-brand-400" /> Notifications
      </h3>
      
      <div className="space-y-3">
        <div>
           <label className="flex items-center gap-2 text-xs text-gray-400 mb-1">
             <Mail size={12} /> Email Alert
           </label>
           <input 
             type="email"
             value={localConfig.email}
             onChange={(e) => setLocalConfig({...localConfig, email: e.target.value})}
             placeholder="me@example.com"
             className="w-full bg-dark-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-brand-500 outline-none"
           />
        </div>

        <div>
           <label className="flex items-center gap-2 text-xs text-gray-400 mb-1">
             <Phone size={12} /> SMS Alert
           </label>
           <input 
             type="tel"
             value={localConfig.phone}
             onChange={(e) => setLocalConfig({...localConfig, phone: e.target.value})}
             placeholder="+1 (555) 000-0000"
             className="w-full bg-dark-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-brand-500 outline-none"
           />
        </div>

        <div className="flex items-center gap-2 pt-1">
           <input 
             type="checkbox"
             id="notifyOnLive"
             checked={localConfig.notifyOnLive}
             onChange={(e) => setLocalConfig({...localConfig, notifyOnLive: e.target.checked})}
             className="rounded border-gray-700 bg-dark-900 text-brand-600 focus:ring-brand-500"
           />
           <label htmlFor="notifyOnLive" className="text-xs text-gray-300">Auto-send link when live</label>
        </div>

        <button 
           onClick={handleSave}
           className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded flex items-center justify-center gap-2 transition-colors"
        >
           {isSaved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;