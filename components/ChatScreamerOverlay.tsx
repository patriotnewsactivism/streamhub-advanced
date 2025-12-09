import React, { useEffect, useState } from 'react';
import { ChatScreamerMessage } from './ChatScreamer';
import { Crown, Star, MessageSquare, Flame, DollarSign } from 'lucide-react';

interface ChatScreamerOverlayProps {
  message: ChatScreamerMessage | null;
  position?: 'top' | 'center' | 'bottom';
  animation?: 'slide' | 'fade' | 'bounce' | 'explosion';
}

const TIER_CONFIG = {
  bronze: {
    gradient: 'from-amber-600 via-amber-700 to-amber-900',
    border: 'border-amber-500',
    glow: 'shadow-amber-500/50',
    icon: MessageSquare,
    particles: 5,
  },
  silver: {
    gradient: 'from-gray-200 via-gray-400 to-gray-600',
    border: 'border-gray-300',
    glow: 'shadow-gray-300/50',
    icon: Star,
    particles: 10,
  },
  gold: {
    gradient: 'from-yellow-300 via-yellow-500 to-yellow-700',
    border: 'border-yellow-400',
    glow: 'shadow-yellow-400/60',
    icon: Crown,
    particles: 20,
  },
  diamond: {
    gradient: 'from-cyan-300 via-blue-400 to-purple-600',
    border: 'border-cyan-300',
    glow: 'shadow-cyan-300/70',
    icon: Flame,
    particles: 40,
  },
};

const ChatScreamerOverlay: React.FC<ChatScreamerOverlayProps> = ({
  message,
  position = 'center',
  animation = 'bounce',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      // Generate particles for higher tier donations
      const config = TIER_CONFIG[message.tier];
      const newParticles = Array.from({ length: config.particles }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
    } else {
      setIsVisible(false);
      setParticles([]);
    }
  }, [message]);

  if (!message || !isVisible) return null;

  const config = TIER_CONFIG[message.tier];
  const TierIcon = config.icon;

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'top-8';
      case 'bottom': return 'bottom-8';
      default: return 'top-1/2 -translate-y-1/2';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'slide': return 'animate-slide-in-right';
      case 'fade': return 'animate-fade-in';
      case 'explosion': return 'animate-explosion';
      default: return 'animate-bounce-in';
    }
  };

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 ${getPositionClasses()} z-50 pointer-events-none`}>
      {/* Particle effects for higher tiers */}
      {message.tier !== 'bronze' && particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: message.tier === 'diamond' ? 'linear-gradient(to right, #67e8f9, #a855f7)' :
                        message.tier === 'gold' ? '#fbbf24' : '#9ca3af',
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
            {message.tier === 'diamond' && (
              <span className="animate-spin-slow">💎</span>
            )}
            {message.tier === 'gold' && (
              <span className="animate-bounce">👑</span>
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

        {/* Decorative corners for diamond tier */}
        {message.tier === 'diamond' && (
          <>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
          </>
        )}
      </div>

      {/* ChatScreamer branding */}
      <div className="text-center mt-2 text-xs text-white/60 font-bold tracking-wider drop-shadow">
        CHATSCREAMER™
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
