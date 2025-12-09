import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Megaphone, DollarSign, Volume2, VolumeX, Settings, X,
  Play, Pause, SkipForward, Trash2, Eye, EyeOff, Zap,
  MessageSquare, Crown, Star, Heart, Flame
} from 'lucide-react';

// Types for ChatScreamer
export interface ChatScreamerMessage {
  id: string;
  donorName: string;
  message: string;
  amount: number;
  currency: string;
  timestamp: Date;
  status: 'pending' | 'playing' | 'completed' | 'skipped';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  platform?: string;
}

export interface ChatScreamerSettings {
  enabled: boolean;
  minAmount: number;
  voiceEnabled: boolean;
  voiceId: string;
  voiceSpeed: number;
  voiceVolume: number;
  overlayDuration: number;
  overlayPosition: 'top' | 'center' | 'bottom';
  overlayAnimation: 'slide' | 'fade' | 'bounce' | 'explosion';
  soundEffect: 'chime' | 'airhorn' | 'tada' | 'cash' | 'none';
  autoPlay: boolean;
  profanityFilter: boolean;
}

interface ChatScreamerProps {
  onOverlayMessage: (message: ChatScreamerMessage | null) => void;
  isStreaming: boolean;
}

// Tier configurations with colors and icons
const TIER_CONFIG = {
  bronze: { min: 1, color: 'from-amber-700 to-amber-900', icon: MessageSquare, label: 'Bronze' },
  silver: { min: 5, color: 'from-gray-300 to-gray-500', icon: Star, label: 'Silver' },
  gold: { min: 20, color: 'from-yellow-400 to-yellow-600', icon: Crown, label: 'Gold' },
  diamond: { min: 100, color: 'from-cyan-300 to-blue-500', icon: Flame, label: 'Diamond' },
};

const getTier = (amount: number): 'bronze' | 'silver' | 'gold' | 'diamond' => {
  if (amount >= 100) return 'diamond';
  if (amount >= 20) return 'gold';
  if (amount >= 5) return 'silver';
  return 'bronze';
};

// Voice options using Web Speech API
const VOICE_OPTIONS = [
  { id: 'default', name: 'Default' },
  { id: 'male-1', name: 'Male Voice' },
  { id: 'female-1', name: 'Female Voice' },
  { id: 'robotic', name: 'Robotic' },
];

const ChatScreamer: React.FC<ChatScreamerProps> = ({ onOverlayMessage, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [queue, setQueue] = useState<ChatScreamerMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<ChatScreamerMessage | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [settings, setSettings] = useState<ChatScreamerSettings>({
    enabled: true,
    minAmount: 1,
    voiceEnabled: true,
    voiceId: 'default',
    voiceSpeed: 1,
    voiceVolume: 0.8,
    overlayDuration: 5000,
    overlayPosition: 'center',
    overlayAnimation: 'bounce',
    soundEffect: 'chime',
    autoPlay: true,
    profanityFilter: true,
  });

  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Process queue when not paused and autoplay is enabled
  useEffect(() => {
    if (!isPaused && settings.autoPlay && settings.enabled && !currentMessage && queue.length > 0) {
      const nextMessage = queue.find(m => m.status === 'pending');
      if (nextMessage) {
        playMessage(nextMessage);
      }
    }
  }, [queue, isPaused, currentMessage, settings.autoPlay, settings.enabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (speechSynthRef.current) speechSynthesis.cancel();
    };
  }, []);

  const playMessage = useCallback(async (message: ChatScreamerMessage) => {
    // Update status
    setQueue(prev => prev.map(m =>
      m.id === message.id ? { ...m, status: 'playing' as const } : m
    ));
    setCurrentMessage(message);
    onOverlayMessage(message);

    // Play sound effect
    if (settings.soundEffect !== 'none') {
      playSoundEffect(settings.soundEffect);
    }

    // Speak the message with TTS
    if (settings.voiceEnabled && 'speechSynthesis' in window) {
      const text = `${message.donorName} says: ${message.message}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.voiceSpeed;
      utterance.volume = settings.voiceVolume;

      // Try to find a suitable voice
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[0]; // Use first available voice
      }

      speechSynthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }

    // Set timer to complete message
    timerRef.current = setTimeout(() => {
      completeMessage(message.id);
    }, settings.overlayDuration);
  }, [settings, onOverlayMessage]);

  const playSoundEffect = (effect: string) => {
    // Sound effects would be loaded from assets
    // For now, we'll use a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (effect) {
      case 'chime':
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        break;
      case 'airhorn':
        oscillator.frequency.value = 440;
        oscillator.type = 'sawtooth';
        break;
      case 'cash':
        oscillator.frequency.value = 1200;
        oscillator.type = 'square';
        break;
      default:
        oscillator.frequency.value = 660;
        oscillator.type = 'sine';
    }

    gainNode.gain.value = 0.3;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const completeMessage = (messageId: string) => {
    setQueue(prev => prev.map(m =>
      m.id === messageId ? { ...m, status: 'completed' as const } : m
    ));
    setCurrentMessage(null);
    onOverlayMessage(null);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const skipMessage = () => {
    if (currentMessage) {
      speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);

      setQueue(prev => prev.map(m =>
        m.id === currentMessage.id ? { ...m, status: 'skipped' as const } : m
      ));
      setCurrentMessage(null);
      onOverlayMessage(null);
    }
  };

  const removeFromQueue = (messageId: string) => {
    setQueue(prev => prev.filter(m => m.id !== messageId));
  };

  const clearCompleted = () => {
    setQueue(prev => prev.filter(m => m.status === 'pending' || m.status === 'playing'));
  };

  // Demo: Add test message
  const addTestMessage = () => {
    const amounts = [2, 5, 10, 25, 50, 100, 500];
    const names = ['CoolViewer123', 'StreamFan', 'GenerousGamer', 'SuperSupporter', 'BigDonor'];
    const messages = [
      'Love the stream! Keep it up!',
      'This is amazing content!',
      'You are the best streamer ever!',
      'Shoutout from Canada!',
      'First time catching you live!',
    ];

    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const newMessage: ChatScreamerMessage = {
      id: Date.now().toString(),
      donorName: names[Math.floor(Math.random() * names.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      amount,
      currency: 'USD',
      timestamp: new Date(),
      status: 'pending',
      tier: getTier(amount),
    };

    setQueue(prev => [...prev, newMessage]);
    setTotalEarnings(prev => prev + amount);
  };

  const pendingCount = queue.filter(m => m.status === 'pending').length;
  const TierIcon = currentMessage ? TIER_CONFIG[currentMessage.tier].icon : Megaphone;

  // Compact view
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-4 py-2 rounded-lg border border-purple-500/40 hover:border-purple-500/60 transition-all group"
      >
        <div className="relative">
          <Megaphone size={18} className="text-purple-400" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {pendingCount}
            </span>
          )}
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-white">ChatScreamer™</div>
          <div className="text-[10px] text-purple-300">${totalEarnings.toFixed(2)} earned</div>
        </div>
        {currentMessage && (
          <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  // Expanded view
  return (
    <div className="bg-dark-800 rounded-xl border border-purple-500/30 overflow-hidden w-80 shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={18} className="text-purple-300" />
          <span className="font-bold text-white">ChatScreamer™</span>
          <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded text-purple-200">BETA</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <Settings size={16} className="text-purple-300" />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <X size={16} className="text-purple-300" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 bg-dark-900 border-b border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Enable ChatScreamer</span>
            <button
              onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
              className={`w-10 h-5 rounded-full transition-colors ${settings.enabled ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Voice Enabled</span>
            <button
              onClick={() => setSettings(s => ({ ...s, voiceEnabled: !s.voiceEnabled }))}
              className={`w-10 h-5 rounded-full transition-colors ${settings.voiceEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.voiceEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <span className="text-xs text-gray-400">Min. Amount ($)</span>
            <input
              type="number"
              value={settings.minAmount}
              onChange={(e) => setSettings(s => ({ ...s, minAmount: Number(e.target.value) }))}
              className="w-full mt-1 bg-dark-800 border border-gray-700 rounded px-2 py-1 text-sm"
              min="1"
            />
          </div>

          <div>
            <span className="text-xs text-gray-400">Display Duration (seconds)</span>
            <input
              type="range"
              value={settings.overlayDuration / 1000}
              onChange={(e) => setSettings(s => ({ ...s, overlayDuration: Number(e.target.value) * 1000 }))}
              className="w-full mt-1"
              min="3"
              max="15"
              step="1"
            />
            <div className="text-xs text-gray-500 text-center">{settings.overlayDuration / 1000}s</div>
          </div>

          <div>
            <span className="text-xs text-gray-400">Animation Style</span>
            <select
              value={settings.overlayAnimation}
              onChange={(e) => setSettings(s => ({ ...s, overlayAnimation: e.target.value as any }))}
              className="w-full mt-1 bg-dark-800 border border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value="slide">Slide In</option>
              <option value="fade">Fade In</option>
              <option value="bounce">Bounce</option>
              <option value="explosion">Explosion</option>
            </select>
          </div>

          <div>
            <span className="text-xs text-gray-400">Sound Effect</span>
            <select
              value={settings.soundEffect}
              onChange={(e) => setSettings(s => ({ ...s, soundEffect: e.target.value as any }))}
              className="w-full mt-1 bg-dark-800 border border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value="chime">Chime</option>
              <option value="airhorn">Air Horn</option>
              <option value="tada">Ta-Da!</option>
              <option value="cash">Cash Register</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="p-2 bg-dark-900 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">${totalEarnings.toFixed(2)}</div>
            <div className="text-[10px] text-gray-500">EARNED</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{pendingCount}</div>
            <div className="text-[10px] text-gray-500">IN QUEUE</div>
          </div>
        </div>
        <button
          onClick={addTestMessage}
          className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded font-bold flex items-center gap-1"
        >
          <Zap size={12} /> Test
        </button>
      </div>

      {/* Now Playing */}
      {currentMessage && (
        <div className={`p-3 bg-gradient-to-r ${TIER_CONFIG[currentMessage.tier].color} border-b border-gray-700`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TierIcon size={16} className="text-white" />
              <span className="text-xs font-bold text-white/80">NOW PLAYING</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={skipMessage} className="p-1 hover:bg-white/20 rounded">
                <SkipForward size={14} className="text-white" />
              </button>
            </div>
          </div>
          <div className="text-white font-bold">{currentMessage.donorName}</div>
          <div className="text-white/90 text-sm">{currentMessage.message}</div>
          <div className="text-white/70 text-xs mt-1">${currentMessage.amount} {currentMessage.currency}</div>
        </div>
      )}

      {/* Queue Controls */}
      <div className="p-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded ${isPaused ? 'bg-green-600' : 'bg-gray-700'} hover:opacity-80 transition-colors`}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <span className="text-xs text-gray-400">{isPaused ? 'Paused' : 'Auto-playing'}</span>
        </div>
        <button
          onClick={clearCompleted}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
        >
          <Trash2 size={12} /> Clear Done
        </button>
      </div>

      {/* Queue List */}
      <div className="max-h-48 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Megaphone size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No messages in queue</p>
            <p className="text-xs mt-1">Donations will appear here</p>
          </div>
        ) : (
          queue.map(msg => (
            <div
              key={msg.id}
              className={`p-2 border-b border-gray-800 flex items-center gap-2 ${
                msg.status === 'completed' ? 'opacity-50' : ''
              } ${msg.status === 'playing' ? 'bg-purple-900/20' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${TIER_CONFIG[msg.tier].color} flex items-center justify-center`}>
                {React.createElement(TIER_CONFIG[msg.tier].icon, { size: 14, className: 'text-white' })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">{msg.donorName}</span>
                  <span className="text-xs text-green-400">${msg.amount}</span>
                </div>
                <div className="text-xs text-gray-400 truncate">{msg.message}</div>
              </div>
              <div className="flex items-center gap-1">
                {msg.status === 'pending' && (
                  <>
                    <button
                      onClick={() => playMessage(msg)}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <Play size={12} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => removeFromQueue(msg.id)}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <X size={12} className="text-gray-400" />
                    </button>
                  </>
                )}
                {msg.status === 'completed' && (
                  <span className="text-[10px] text-green-500">Done</span>
                )}
                {msg.status === 'skipped' && (
                  <span className="text-[10px] text-yellow-500">Skipped</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Integration Note */}
      <div className="p-2 bg-dark-900 border-t border-gray-700">
        <p className="text-[10px] text-gray-500 text-center">
          Connect Stripe, PayPal, or StreamElements for real donations
        </p>
      </div>
    </div>
  );
};

export default ChatScreamer;
