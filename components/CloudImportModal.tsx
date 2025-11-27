import React, { useState } from 'react';
import { CloudProvider, MediaType } from '../types';
import { X, Folder, FileVideo, Image as ImageIcon, Music, Loader2, Check } from 'lucide-react';

interface CloudImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: { name: string; url: string; type: MediaType }) => void;
}

const PROVIDERS: { name: CloudProvider; icon: string; color: string }[] = [
  { name: 'Google Drive', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg', color: 'text-blue-500' },
  { name: 'Dropbox', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg', color: 'text-blue-600' },
  { name: 'OneDrive', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg', color: 'text-blue-400' },
  { name: 'Box', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Box_logo_2016.svg', color: 'text-blue-500' },
  { name: 'AWS S3', icon: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg', color: 'text-orange-500' },
  { name: 'Google Cloud', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg', color: 'text-red-500' },
];

// Mock files to "discover" in the cloud
const MOCK_FILES = [
  { name: 'Company_Intro.mp4', type: 'video' as MediaType, url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
  { name: 'Live_Background_Loop.mp4', type: 'video' as MediaType, url: 'https://media.w3.org/2010/05/sintel/trailer.mp4' },
  { name: 'Logo_Transparent.png', type: 'image' as MediaType, url: 'https://cdn.pixabay.com/photo/2017/01/31/13/14/animal-2023924_1280.png' },
  { name: 'Stream_Overlay_Template.png', type: 'image' as MediaType, url: 'https://cdn.pixabay.com/photo/2022/01/11/21/48/link-6931554_1280.png' },
  { name: 'Background_Chill_Music.mp3', type: 'audio' as MediaType, url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' }, // Placeholder audio
];

const CloudImportModal: React.FC<CloudImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'authenticated'>('idle');
  const [files, setFiles] = useState<typeof MOCK_FILES>([]);

  const handleConnect = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    setAuthStatus('authenticating');
    // Simulate OAuth delay
    setTimeout(() => {
      setAuthStatus('authenticated');
      setFiles(MOCK_FILES);
    }, 1500);
  };

  const handleImport = (file: typeof MOCK_FILES[0]) => {
    onImport(file);
    onClose();
  };

  const handleBack = () => {
      setSelectedProvider(null);
      setAuthStatus('idle');
      setFiles([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 w-full max-w-2xl rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-dark-900">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {selectedProvider ? (
                <>
                    <button onClick={handleBack} className="text-gray-400 hover:text-white text-sm underline mr-2">Providers</button>
                    <span className="text-gray-600">/</span> 
                    {selectedProvider}
                </>
            ) : (
                'Cloud Import Center'
            )}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Provider List */}
          {!selectedProvider && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PROVIDERS.map((p) => (
                <button 
                  key={p.name}
                  onClick={() => handleConnect(p.name)}
                  className="flex flex-col items-center justify-center p-6 bg-dark-900 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-brand-500 transition-all group"
                >
                  <div className="w-12 h-12 mb-3 bg-white/10 rounded-full flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                     {/* Using external SVGs for icons can be flaky, using text/color fallback if needed, but img tag is best */}
                     <img src={p.icon} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-medium text-gray-200">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Authenticating State */}
          {selectedProvider && authStatus === 'authenticating' && (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="animate-spin text-brand-500 mb-4" size={48} />
              <p className="text-lg font-medium">Connecting to {selectedProvider}...</p>
              <p className="text-sm text-gray-500">Please wait while we authorize access.</p>
            </div>
          )}

          {/* File Browser */}
          {selectedProvider && authStatus === 'authenticated' && (
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-sm text-green-400 mb-4 bg-green-900/20 p-2 rounded">
                  <Check size={16} /> Successfully connected to account user@example.com
               </div>
               
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Files</h3>
               <div className="space-y-2">
                  {files.map((file, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleImport(file)}
                        className="w-full flex items-center gap-4 p-3 bg-dark-900 border border-gray-800 rounded-lg hover:border-brand-500 hover:bg-dark-800 transition-all text-left group"
                      >
                         <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center shrink-0">
                            {file.type === 'video' && <FileVideo className="text-blue-400" />}
                            {file.type === 'image' && <ImageIcon className="text-purple-400" />}
                            {file.type === 'audio' && <Music className="text-green-400" />}
                         </div>
                         <div className="flex-1">
                            <div className="font-medium text-gray-200 group-hover:text-white">{file.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{file.type} • Cloud Asset</div>
                         </div>
                         <div className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-400 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                            Import
                         </div>
                      </button>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-dark-900 border-t border-gray-700 text-center">
             <p className="text-xs text-gray-500">Secure connection via OAuth 2.0. No files are stored on our servers.</p>
        </div>
      </div>
    </div>
  );
};

export default CloudImportModal;