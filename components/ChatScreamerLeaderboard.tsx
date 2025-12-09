import React, { useState, useEffect } from 'react';
import {
  Trophy, Crown, Medal, Award, Star, TrendingUp, Gift,
  Clock, Users, DollarSign, Zap, ChevronRight, Sparkles
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  streamerId: string;
  streamerName: string;
  avatarUrl?: string;
  chatScreamerCount: number;
  totalEarnings: number;
  topDonation: number;
  isCurrentUser?: boolean;
}

interface ChatScreamerLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

// Mock data - would come from backend
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, streamerId: '1', streamerName: 'GamerGod420', chatScreamerCount: 347, totalEarnings: 4523.50, topDonation: 500 },
  { rank: 2, streamerId: '2', streamerName: 'StreamQueen', chatScreamerCount: 289, totalEarnings: 3891.25, topDonation: 250 },
  { rank: 3, streamerId: '3', streamerName: 'ProPlayer_X', chatScreamerCount: 256, totalEarnings: 3245.00, topDonation: 150 },
  { rank: 4, streamerId: '4', streamerName: 'ChillStreamer', chatScreamerCount: 198, totalEarnings: 2567.75, topDonation: 100 },
  { rank: 5, streamerId: '5', streamerName: 'NightOwlTV', chatScreamerCount: 167, totalEarnings: 2134.50, topDonation: 100 },
  { rank: 6, streamerId: '6', streamerName: 'CasualCarl', chatScreamerCount: 145, totalEarnings: 1823.00, topDonation: 75 },
  { rank: 7, streamerId: '7', streamerName: 'TechTalks', chatScreamerCount: 134, totalEarnings: 1654.25, topDonation: 50 },
  { rank: 8, streamerId: '8', streamerName: 'MusicMaven', chatScreamerCount: 112, totalEarnings: 1432.50, topDonation: 50 },
  { rank: 9, streamerId: '9', streamerName: 'ArtistAlley', chatScreamerCount: 98, totalEarnings: 1234.00, topDonation: 100 },
  { rank: 10, streamerId: '10', streamerName: 'FoodieStream', chatScreamerCount: 87, totalEarnings: 1087.75, topDonation: 50 },
];

const ChatScreamerLeaderboard: React.FC<ChatScreamerLeaderboardProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);

  // Calculate time until Sunday midnight (weekly reset)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + (7 - now.getDay()));
      sunday.setHours(0, 0, 0, 0);

      const diff = sunday.getTime() - now.getTime();

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-400" size={24} />;
      case 2: return <Medal className="text-gray-300" size={22} />;
      case 3: return <Medal className="text-amber-600" size={20} />;
      default: return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border-yellow-500/50';
      case 2: return 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-400/50';
      case 3: return 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-600/50';
      default: return 'bg-dark-900 border-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 w-full max-w-2xl max-h-[90vh] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-red-900 p-6 relative overflow-hidden">
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                  <Trophy size={28} className="text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">WEEKLY LEADERBOARD</h2>
                  <p className="text-purple-200 text-sm">Most ChatScreamers received wins!</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Prize Banner */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/30 rounded-full flex items-center justify-center animate-bounce">
                <Gift size={24} className="text-yellow-300" />
              </div>
              <div className="flex-1">
                <div className="text-yellow-300 font-black text-lg">🏆 WEEKLY PRIZE</div>
                <div className="text-white font-bold">FREE MONTH of Business Tier ($59.99 value!)</div>
                <div className="text-yellow-200/70 text-sm">Unlimited Cloud VM streaming hours</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-300 uppercase font-bold">Resets In</div>
                <div className="text-white font-mono font-bold text-lg">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.streamerId}
              className={`p-4 rounded-xl border ${getRankStyle(entry.rank)} ${
                entry.isCurrentUser ? 'ring-2 ring-purple-500' : ''
              } transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {entry.streamerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate flex items-center gap-2">
                      {entry.streamerName}
                      {entry.rank === 1 && <Sparkles size={14} className="text-yellow-400" />}
                      {entry.isCurrentUser && (
                        <span className="text-xs bg-purple-500 px-2 py-0.5 rounded">YOU</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Top donation: ${entry.topDonation}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Zap size={16} className="text-purple-400" />
                    <span className="text-2xl font-black text-white">{entry.chatScreamerCount}</span>
                  </div>
                  <div className="text-xs text-gray-400">ChatScreamers</div>
                </div>

                {/* Earnings */}
                <div className="text-right w-24">
                  <div className="text-lg font-bold text-green-400">
                    ${entry.totalEarnings.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">earned</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-dark-900 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              <span className="text-purple-400 font-bold">Pro tip:</span> Share your ChatScreamer link to get more donations!
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Rules Section */}
        <div className="px-4 pb-4">
          <details className="bg-dark-900 rounded-lg border border-gray-700">
            <summary className="p-3 cursor-pointer text-sm font-bold text-gray-400 hover:text-white flex items-center gap-2">
              <ChevronRight size={14} className="transition-transform" />
              Contest Rules
            </summary>
            <div className="px-3 pb-3 text-xs text-gray-500 space-y-1">
              <p>• Contest runs Sunday 12:00 AM to Saturday 11:59 PM (UTC)</p>
              <p>• Winner determined by total number of individual ChatScreamer donations received</p>
              <p>• Minimum $5 donations only - no self-donations allowed</p>
              <p>• Prize: 1 month FREE Business tier ($59.99 value)</p>
              <p>• Winner announced every Sunday and credited automatically</p>
              <p>• StreamHub reserves the right to disqualify fraudulent entries</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ChatScreamerLeaderboard;
