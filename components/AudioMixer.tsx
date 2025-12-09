
import React, { useState } from 'react';
import { AudioMixerState } from '../types';
import { Mic, Music, Film, Volume2, VolumeX, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

interface AudioMixerProps {
  mixerState: AudioMixerState;
  onChange: (key: keyof AudioMixerState, value: number) => void;
}

const AudioMixer: React.FC<AudioMixerProps> = ({ mixerState, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderSlider = (
    label: string,
    icon: React.ReactNode,
    value: number,
    field: keyof AudioMixerState
  ) => (
    <div className="flex flex-col gap-1 min-w-[80px] flex-1">
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
        <span className="flex items-center gap-1">{icon} {label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="flex items-center gap-2 h-8 bg-dark-900 rounded-lg px-2 border border-gray-700 relative overflow-hidden group">
        {/* Background Level Meter Simulation */}
        <div
            className="absolute left-0 top-0 bottom-0 bg-brand-900/40 transition-all duration-75 ease-out pointer-events-none"
            style={{ width: `${value * 100}%` }}
        />

        <button
            onClick={() => onChange(field, value === 0 ? 0.8 : 0)}
            className="z-10 text-gray-400 hover:text-white"
        >
            {value === 0 ? <VolumeX size={14}/> : <Volume2 size={14}/>}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(field, parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
      </div>
    </div>
  );

  // Compact view - just a toggle button with level indicators
  const CompactView = () => (
    <button
      onClick={() => setIsExpanded(true)}
      className="flex items-center gap-3 bg-dark-900/50 px-3 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all group"
    >
      <SlidersHorizontal size={16} className="text-brand-400" />
      <div className="flex items-center gap-2">
        {/* Mini level indicators */}
        <div className="flex items-center gap-1">
          <Mic size={10} className="text-gray-500" />
          <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${mixerState.micVolume * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Music size={10} className="text-gray-500" />
          <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 transition-all" style={{ width: `${mixerState.musicVolume * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Film size={10} className="text-gray-500" />
          <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${mixerState.videoVolume * 100}%` }} />
          </div>
        </div>
      </div>
      <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
    </button>
  );

  // Expanded view - full controls
  const ExpandedView = () => (
    <div className="bg-dark-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(false)}
        className="w-full flex items-center justify-between px-3 py-2 border-b border-gray-700/50 hover:bg-dark-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400">
          <SlidersHorizontal size={14} className="text-brand-400" />
          Audio Mixer
        </div>
        <ChevronUp size={14} className="text-gray-500" />
      </button>
      <div className="flex flex-col md:flex-row gap-3 md:gap-6 p-3">
        {renderSlider('Mic', <Mic size={12}/>, mixerState.micVolume, 'micVolume')}
        {renderSlider('Music', <Music size={12}/>, mixerState.musicVolume, 'musicVolume')}
        {renderSlider('Video', <Film size={12}/>, mixerState.videoVolume, 'videoVolume')}
      </div>
    </div>
  );

  return isExpanded ? <ExpandedView /> : <CompactView />;
};

export default AudioMixer;
