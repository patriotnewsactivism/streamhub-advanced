import React from 'react';
import { X, Play, AlertTriangle, CheckCircle, XCircle, Globe, Camera, Mic, Monitor } from 'lucide-react';
import { Destination } from '../types';

interface PreStreamConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  destinations: Destination[];
  hasCamera: boolean;
  hasMic: boolean;
  hasScreen: boolean;
  streamTitle?: string;
}

const PreStreamConfirmation: React.FC<PreStreamConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  destinations,
  hasCamera,
  hasMic,
  hasScreen,
  streamTitle,
}) => {
  if (!isOpen) return null;

  const enabledDestinations = destinations.filter(d => d.isEnabled);
  const hasDestinations = enabledDestinations.length > 0;
  const hasVideoSource = hasCamera || hasScreen;
  const isReady = hasDestinations && hasVideoSource;

  const warnings: string[] = [];
  if (!hasVideoSource) warnings.push('No video source active (camera or screen share)');
  if (!hasMic) warnings.push('Microphone is muted or not available');
  if (!hasDestinations) warnings.push('No streaming destinations enabled');
  if (!streamTitle) warnings.push('No stream title set (AI generation recommended)');

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 p-6 border-b border-gray-700 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Play className="text-red-400" size={28} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ready to Go Live?</h2>
              <p className="text-sm text-gray-400 mt-1">Review your setup before broadcasting</p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="p-6 space-y-4">
          {/* Video Sources */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-gray-500">Video Sources</h3>
            <div className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg border border-gray-700">
              <Camera size={20} className={hasCamera ? 'text-green-400' : 'text-gray-600'} />
              <span className={hasCamera ? 'text-white' : 'text-gray-500'}>Camera</span>
              {hasCamera ? (
                <CheckCircle className="ml-auto text-green-400" size={18} />
              ) : (
                <XCircle className="ml-auto text-gray-600" size={18} />
              )}
            </div>
            <div className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg border border-gray-700">
              <Monitor size={20} className={hasScreen ? 'text-green-400' : 'text-gray-600'} />
              <span className={hasScreen ? 'text-white' : 'text-gray-500'}>Screen Share</span>
              {hasScreen ? (
                <CheckCircle className="ml-auto text-green-400" size={18} />
              ) : (
                <XCircle className="ml-auto text-gray-600" size={18} />
              )}
            </div>
            <div className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg border border-gray-700">
              <Mic size={20} className={hasMic ? 'text-green-400' : 'text-yellow-500'} />
              <span className={hasMic ? 'text-white' : 'text-yellow-500'}>Microphone</span>
              {hasMic ? (
                <CheckCircle className="ml-auto text-green-400" size={18} />
              ) : (
                <AlertTriangle className="ml-auto text-yellow-500" size={18} />
              )}
            </div>
          </div>

          {/* Destinations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-gray-500">
              Broadcasting To ({enabledDestinations.length} destination{enabledDestinations.length !== 1 ? 's' : ''})
            </h3>
            {enabledDestinations.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {enabledDestinations.map(dest => (
                  <div
                    key={dest.id}
                    className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg border border-gray-700"
                  >
                    <Globe size={18} className="text-brand-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{dest.name}</div>
                      <div className="text-xs text-gray-500">{dest.platform}</div>
                    </div>
                    <CheckCircle className="text-green-400 shrink-0" size={18} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
                <XCircle className="text-red-400 mx-auto mb-2" size={24} />
                <p className="text-sm text-red-300">No destinations enabled</p>
                <p className="text-xs text-red-400 mt-1">Add at least one destination to go live</p>
              </div>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-yellow-500 flex items-center gap-2">
                <AlertTriangle size={14} />
                Warnings
              </h3>
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <ul className="text-sm text-yellow-300 space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-dark-900 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={!isReady}
            className={`px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
              isReady
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play size={18} fill="currentColor" />
            GO LIVE NOW
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreStreamConfirmation;
