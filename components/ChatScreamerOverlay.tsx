import React, { useEffect, useState } from 'react';
import { ChatScreamerMessage } from './ChatScreamer';
import { Crown, Star, MessageSquare, Flame, DollarSign, Volume2, Zap } from 'lucide-react';
import { CHATSCREAMER_TIERS, ChatScreamerTier } from '../services/stripeService';

interface ChatScreamerOverlayProps {
  message: ChatScreamerMessage | null;
  position?: 'top' | 'center' | 'bottom';
}

// Visual config for overlay display - matches the tier system
const TIER_OVERLAY_CONFIG = {
  basic: {
    gradient: 'from-blue-600 via-blue-700 to-blue-900',
    border: 'border-blue-500',
    glow: 'shadow-blue-500/30',
    icon: MessageSquare,
    particles: 0,
    shake: false,
    fullScreen: false,
  },
  loud: {
    gradient: 'from-green-500 via-emerald-600 to-green-800',
    border: 'border-green-400',
    glow: 'shadow-green-400/50',
    icon: Volume2,
    particles: 5,
    shake: false,
    fullScreen: false,
  },
  mega: {
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
    border: 'border-yellow-400',
    glow: 'shadow-yellow-400/60',
    icon: Star,
    particles: 15,
    shake: false,
    fullScreen: false,
  },
  ultra: {
    gradient: 'from-red-500 via-pink-500 to-purple-600',
    border: 'border-red-400',
    glow: 'shadow-red-400/70',
    icon: Crown,
    particles: 30,
    shake: true, // SCREEN SHAKE!
    fullScreen: false,
  },
  legendary: {
    gradient: 'from-purple-500 via-pink-500 to-yellow-500',
    border: 'border-purple-400',
    glow: 'shadow-purple-400/80',
    icon: Flame,
    particles: 50,
    shake: true,
    fullScreen: true, // TAKES OVER THE SCREEN!
  },
};

const ChatScreamerOverlay: React.FC<ChatScreamerOverlayProps> = ({
  message,
  position = 'center',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const config = TIER_OVERLAY_CONFIG[message.tier];

      // Generate particles for higher tier donations
      const newParticles = Array.from({ length: config.particles }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);

      // Generate confetti for legendary tier
      if (message.tier === 'legendary') {
        const newConfetti = Array.from({ length: 100 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'][Math.floor(Math.random() * 8)],
          delay: Math.random() * 2,
        }));
        setConfetti(newConfetti);
      }

      // Trigger screen shake for ultra/legendary
      if (config.shake) {
        setIsShaking(true);
        // Keep shaking for the duration
        const shakeTimer = setTimeout(() => setIsShaking(false), 3000);
        return () => clearTimeout(shakeTimer);
      }
    } else {
      setIsVisible(false);
      setParticles([]);
      setConfetti([]);
      setIsShaking(false);
    }
  }, [message]);

  if (!message || !isVisible) return null;

  const config = TIER_OVERLAY_CONFIG[message.tier];
  const TierIcon = config.icon;

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'top-8';
      case 'bottom': return 'bottom-8';
      default: return 'top-1/2 -translate-y-1/2';
    }
  };

  const getAnimationClasses = () => {
    if (message.tier === 'legendary') return 'animate-legendary-entrance';
    if (message.tier === 'ultra') return 'animate-explosion';
    if (message.tier === 'mega') return 'animate-explosion';
    if (message.tier === 'loud') return 'animate-bounce-in';
    return 'animate-fade-in';
  };

  const getParticleColor = () => {
    switch (message.tier) {
      case 'legendary': return 'linear-gradient(to right, #a855f7, #ec4899, #ef4444)';
      case 'ultra': return 'linear-gradient(to right, #ef4444, #ec4899)';
      case 'mega': return '#fbbf24';
      case 'loud': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  // Full screen takeover for LEGENDARY tier
  if (config.fullScreen) {
    return (
      <div className={`fixed inset-0 z-[100] pointer-events-none ${isShaking ? 'animate-screen-shake' : ''}`}>
        {/* Epic background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-pink-900/90 to-red-900/90 animate-pulse-slow" />

        {/* Confetti explosion */}
        {confetti.map(piece => (
          <div
            key={piece.id}
            className="absolute w-3 h-3 animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              top: '-5%',
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}

        {/* Centered LEGENDARY content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-legendary-entrance">
            {/* Massive icon */}
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center animate-spin-slow shadow-2xl shadow-purple-500/50">
              <Flame size={64} className="text-white drop-shadow-lg" />
            </div>

            {/* LEGENDARY badge */}
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-4 animate-pulse">
              🔥 LEGENDARY 🔥
            </div>

            {/* Amount */}
            <div className="text-5xl font-black text-green-400 mb-4 flex items-center justify-center gap-2 animate-bounce">
              <DollarSign size={48} />
              {message.amount}
            </div>

            {/* Donor name */}
            <div className="text-4xl font-black text-white mb-6 drop-shadow-lg">
              {message.donorName}
            </div>

            {/* Message in huge text */}
            <div className="max-w-4xl mx-auto px-8 py-6 bg-black/50 rounded-3xl border-4 border-purple-500/50">
              <div className="text-3xl text-white font-bold italic">
                "{message.message}"
              </div>
            </div>

            {/* ChatScream branding */}
            <div className="mt-8 flex flex-col items-center">
              <span className="brand-title text-4xl">ChatScream</span>
              <span className="brand-subtitle text-sm text-white/70">by We The People News</span>
            </div>
          </div>
        </div>

        {/* Corner sparkles */}
        <div className="absolute top-4 left-4 text-6xl animate-spin-slow">✨</div>
        <div className="absolute top-4 right-4 text-6xl animate-spin-slow" style={{ animationDelay: '0.5s' }}>💎</div>
        <div className="absolute bottom-4 left-4 text-6xl animate-spin-slow" style={{ animationDelay: '1s' }}>🔥</div>
        <div className="absolute bottom-4 right-4 text-6xl animate-spin-slow" style={{ animationDelay: '1.5s' }}>⭐</div>
      </div>
    );
  }

  // Standard overlay for other tiers
  return (
    <div className={`absolute left-1/2 -translate-x-1/2 ${getPositionClasses()} z-50 pointer-events-none ${isShaking ? 'animate-screen-shake' : ''}`}>
      {/* Particle effects for higher tiers */}
      {message.tier !== 'basic' && particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: getParticleColor(),
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* Main alert card */}
      <div
        className={`
          relative max-w-lg px-6 py-4 rounded-2xl
          bg-gradient-to-r ${config.gradient}
          border-2 ${config.border}
          shadow-2xl ${config.glow}
          ${getAnimationClasses()}
        `}
      >
        {/* Glow effect behind */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${config.gradient} blur-xl opacity-50 -z-10`} />

        {/* Amount badge */}
        <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1 shadow-lg animate-pulse">
          <DollarSign size={14} />
          {message.amount}
        </div>

        {/* Tier icon */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur flex items-center justify-center border-2 border-white/30">
          <TierIcon size={24} className="text-white drop-shadow-lg" />
        </div>

        {/* Content */}
        <div className="ml-6">
          {/* Donor name with sparkle effect */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-white drop-shadow-lg tracking-tight">
              {message.donorName}
            </span>
            {message.tier === 'ultra' && (
              <span className="animate-bounce">👑</span>
            )}
            {message.tier === 'mega' && (
              <span className="animate-bounce">⭐</span>
            )}
          </div>

          {/* Message */}
          <div className="text-lg text-white/95 font-medium drop-shadow max-w-md">
            "{message.message}"
          </div>

          {/* Platform badge */}
          {message.platform && (
            <div className="mt-2 inline-block text-xs bg-black/30 text-white/70 px-2 py-0.5 rounded">
              via {message.platform}
            </div>
          )}
        </div>

        {/* Decorative corners for ultra tier */}
        {message.tier === 'ultra' && (
          <>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
          </>
        )}
      </div>

      {/* ChatScream branding */}
      <div className="text-center mt-2 flex flex-col items-center">
        <span className="brand-title text-lg">ChatScream</span>
        <span className="brand-subtitle text-[10px] text-white/60">by We The People News</span>
      </div>
    </div>
  );
};

export default ChatScreamerOverlay;

// Add these CSS animations to your global styles or index.html
/*
@keyframes bounce-in {
  0% { transform: scale(0) translateX(-50%); opacity: 0; }
  50% { transform: scale(1.1) translateX(-50%); }
  100% { transform: scale(1) translateX(-50%); opacity: 1; }
}

@keyframes slide-in-right {
  0% { transform: translateX(100%) translateY(-50%); opacity: 0; }
  100% { transform: translateX(-50%) translateY(-50%); opacity: 1; }
}

@keyframes explosion {
  0% { transform: scale(0) translateX(-50%); opacity: 0; }
  30% { transform: scale(1.5) translateX(-50%); opacity: 1; }
  100% { transform: scale(1) translateX(-50%); opacity: 1; }
}

@keyframes particle {
  0% { transform: scale(1) translate(0, 0); opacity: 1; }
  100% { transform: scale(0) translate(var(--tx), var(--ty)); opacity: 0; }
}

.animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }
.animate-slide-in-right { animation: slide-in-right 0.4s ease-out forwards; }
.animate-explosion { animation: explosion 0.6s ease-out forwards; }
.animate-particle { animation: particle 1s ease-out forwards; }
.animate-spin-slow { animation: spin 3s linear infinite; }
*/
