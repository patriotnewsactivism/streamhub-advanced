import React, { useState } from 'react';
import { MediaType } from '../types';
import { X, Link as LinkIcon, Download, Globe, AlertTriangle } from 'lucide-react';

interface CloudImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: { name: string; url: string; type: MediaType }) => void;
}

const CloudImportModal: React.FC<CloudImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<MediaType>('video');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
      setError(null);
      if (!url) {
          setError('Please enter a valid URL');
          return;
      }
      
      try {
          new URL(url); // Validate URL format
      } catch (e) {
          setError('Invalid URL format');
          return;
      }

      // In a real app, we might HEAD request the URL to check content-type, 
      // but here we trust the user for the "Add" action.
      onImport({
          name: name || 'Imported Cloud Asset',
          url: url,
          type: type
      });
      
      // Reset
      setUrl('');
      setName('');
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-800 w-full max-w-lg rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-dark-900">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Globe className="text-brand-500" size={20} /> Import from URL
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        <div className="p-6 space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-500/20 p-3 rounded flex gap-3">
                <AlertTriangle className="text-yellow-500 shrink-0" size={18} />
                <p className="text-xs text-yellow-200/80">
                    To import from Google Drive, Dropbox, or S3, please paste a <strong>Direct Download Link</strong> or a publicly accessible URL to the media file.
                </p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Media Type</label>
                <div className="flex bg-dark-900 p-1 rounded border border-gray-700">
                    {(['image', 'video', 'audio'] as MediaType[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded capitalize transition-all ${type === t ? 'bg-brand-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Direct File URL</label>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/video.mp4"
                        className="w-full bg-dark-900 border border-gray-700 rounded pl-10 p-2 text-sm text-white focus:border-brand-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Asset Name</label>
                <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Awesome Video"
                    className="w-full bg-dark-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-brand-500 outline-none"
                />
            </div>
            
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
        </div>

        <div className="p-4 bg-dark-900 border-t border-gray-700 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
             <button 
                onClick={handleImport}
                disabled={!url}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Download size={16} /> Import Asset
             </button>
        </div>
      </div>
    </div>
  );
};

export default CloudImportModal;