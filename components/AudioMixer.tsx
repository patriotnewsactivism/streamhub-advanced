
import React from 'react';
import { AudioMixerState } from '../types';
import { Mic, Music, Film, Volume2, VolumeX } from 'lucide-react';

interface AudioMixerProps {
  mixerState: AudioMixerState;
  onChange: (key: keyof AudioMixerState, value: number) => void;
}

const AudioMixer: React.FC<AudioMixerProps> = ({ mixerState, onChange }) => {
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

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-6 bg-dark-900/50 p-2 rounded-lg border border-gray-700/50">
      {renderSlider('Mic', <Mic size={12}/>, mixerState.micVolume, 'micVolume')}
      {renderSlider('Music', <Music size={12}/>, mixerState.musicVolume, 'musicVolume')}
      {renderSlider('Video', <Film size={12}/>, mixerState.videoVolume, 'videoVolume')}
    </div>
  );
};

export default AudioMixer;
