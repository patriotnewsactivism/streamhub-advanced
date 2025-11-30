import React from 'react';
import { LayoutMode } from '../types';
import { Layout, Maximize, Square, Columns, User } from 'lucide-react';

interface LayoutSelectorProps {
  currentLayout: LayoutMode;
  onSelect: (mode: LayoutMode) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onSelect }) => {
  const layouts = [
    { mode: LayoutMode.FULL_CAM, label: 'Solo', icon: <User size={20} /> },
    { mode: LayoutMode.FULL_SCREEN, label: 'Screen', icon: <Maximize size={20} /> },
    { mode: LayoutMode.PIP, label: 'PiP', icon: <Layout size={20} /> },
    { mode: LayoutMode.SPLIT, label: 'Split', icon: <Columns size={20} /> },
    { mode: LayoutMode.NEWSROOM, label: 'News', icon: <Square size={20} /> },
  ];

  return (
    <div className="flex flex-row md:flex-wrap gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
      {layouts.map((item) => (
        <button
          key={item.mode}
          onClick={() => onSelect(item.mode)}
          className={`flex flex-col items-center justify-center gap-1.5 p-2 md:p-3 rounded-lg transition-all min-w-[70px] md:min-w-[80px] shrink-0
            ${currentLayout === item.mode 
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50 scale-105' 
              : 'bg-dark-800/50 md:bg-transparent text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
        >
          {item.icon}
          <span className="text-[10px] md:text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LayoutSelector;