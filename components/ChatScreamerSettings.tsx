import React, { useState } from 'react';
import {
  Megaphone, DollarSign, Volume2, VolumeX, Settings, X, Save,
  Play, Eye, Palette, Clock, Zap, Music, Bell, Link, Copy,
  CheckCircle, ExternalLink, CreditCard, TrendingUp, AlertTriangle
} from 'lucide-react';
import { CHATSCREAMER_TIERS, ChatScreamerTier } from '../services/stripeService';

interface ChatScreamerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  streamerId: string;
  streamerName: string;
}

// Sound effect options with audio previews
const SOUND_EFFECTS = [
  { id: 'chime', name: 'Chime', description: 'Pleasant notification chime' },
  { id: 'airhorn', name: 'Air Horn', description: 'Classic MLG air horn' },
  { id: 'airhorn_long', name: 'Air Horn (Long)', description: 'Extended air horn blast' },
  { id: 'tada', name: 'Ta-Da!', description: 'Celebration fanfare' },
  { id: 'cash', name: 'Cash Register', description: 'Ka-ching! Money sound' },
  { id: 'siren', name: 'Siren', description: 'Alert siren' },
  { id: 'legendary_fanfare', name: 'Legendary Fanfare', description: 'Epic orchestral hit' },
  { id: 'bruh', name: 'Bruh', description: 'Bruh sound effect #2' },
  { id: 'wow', name: 'WOW', description: 'Owen Wilson wow' },
  { id: 'oof', name: 'OOF', description: 'Roblox death sound' },
  { id: 'nope', name: 'NOPE', description: 'TF2 Engineer nope' },
  { id: 'sad_trombone', name: 'Sad Trombone', description: 'Wah wah waaah' },
];

// Animation options
const ANIMATIONS = [
  { id: 'fade', name: 'Fade In', description: 'Simple fade in' },
  { id: 'slide', name: 'Slide In', description: 'Slides from the side' },
  { id: 'bounce', name: 'Bounce', description: 'Bouncy entrance' },
  { id: 'explosion', name: 'Explosion', description: 'Explodes onto screen' },
  { id: 'earthquake', name: 'Earthquake', description: 'Screen shake effect' },
  { id: 'legendary', name: 'Legendary', description: 'Full epic entrance' },
  { id: 'spin', name: 'Spin In', description: 'Spins into view' },
  { id: 'glitch', name: 'Glitch', description: 'Digital glitch effect' },
  { id: 'rainbow', name: 'Rainbow', description: 'Color cycling rainbow' },
];

// Voice options
const VOICE_OPTIONS = [
  { id: 'default', name: 'Default', description: 'System default voice' },
  { id: 'male_deep', name: 'Deep Male', description: 'Deep masculine voice' },
  { id: 'female_high', name: 'High Female', description: 'Higher pitched female' },
  { id: 'robot', name: 'Robot', description: 'Robotic synthesized voice' },
  { id: 'whisper', name: 'Whisper', description: 'ASMR whisper voice' },
  { id: 'shout', name: 'Shouting', description: 'LOUD SHOUTING VOICE' },
];

const ChatScreamerSettings: React.FC<ChatScreamerSettingsProps> = ({
  isOpen,
  onClose,
  streamerId,
  streamerName,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'tiers' | 'sounds' | 'appearance' | 'integration'>('general');
  const [settings, setSettings] = useState({
    enabled: true,
    minAmount: 5,
    maxMessageLength: 200,
    defaultVoice: 'default',
    defaultVolume: 0.8,
    defaultAnimation: 'bounce',
    profanityFilter: false, // They paid for it!
    requireApproval: false,
    allowCustomSounds: true,
    donationLink: `https://streamhub.pro/donate/${streamerId}`,
    stripeConnected: false,
    paypalConnected: false,
  });

  const [copied, setCopied] = useState(false);

  const copyDonationLink = () => {
    navigator.clipboard.writeText(settings.donationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const tierEntries = Object.entries(CHATSCREAMER_TIERS) as [ChatScreamerTier, typeof CHATSCREAMER_TIERS[ChatScreamerTier]][];

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Megaphone size={24} className="text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                ChatScreamer™ Settings
                <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded">BETA</span>
              </h2>
              <p className="text-sm text-purple-200">Configure your donation alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} className="text-purple-300" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-dark-900">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'tiers', label: 'Tier Pricing', icon: DollarSign },
            { id: 'sounds', label: 'Sounds', icon: Music },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'integration', label: 'Integration', icon: Link },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-dark-900 rounded-lg border border-gray-700">
                <div>
                  <h3 className="font-bold text-white">Enable ChatScreamer</h3>
                  <p className="text-sm text-gray-400">Allow viewers to send paid messages</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                  className={`w-14 h-7 rounded-full transition-colors ${settings.enabled ? 'bg-purple-500' : 'bg-gray-600'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.enabled ? 'translate-x-7' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Minimum Amount */}
              <div className="p-4 bg-dark-900 rounded-lg border border-gray-700">
                <h3 className="font-bold text-white mb-2">Minimum Donation</h3>
                <p className="text-sm text-gray-400 mb-3">$5 minimum to send a ChatScreamer</p>
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-green-400" />
                  <input
                    type="number"
                    value={settings.minAmount}
                    onChange={(e) => setSettings(s => ({ ...s, minAmount: Math.max(5, Number(e.target.value)) }))}
                    className="w-24 bg-dark-800 border border-gray-600 rounded px-3 py-2 text-white"
                    min="5"
                  />
                  <span className="text-gray-400">USD minimum</span>
                </div>
              </div>

              {/* Max Message Length */}
              <div className="p-4 bg-dark-900 rounded-lg border border-gray-700">
                <h3 className="font-bold text-white mb-2">Maximum Message Length</h3>
                <p className="text-sm text-gray-400 mb-3">Higher tiers get more characters</p>
                <input
                  type="range"
                  value={settings.maxMessageLength}
                  onChange={(e) => setSettings(s => ({ ...s, maxMessageLength: Number(e.target.value) }))}
                  className="w-full"
                  min="50"
                  max="500"
                  step="50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50 chars</span>
                  <span className="text-purple-400 font-bold">{settings.maxMessageLength} characters</span>
                  <span>500 chars</span>
                </div>
              </div>

              {/* Donation Link */}
              <div className="p-4 bg-dark-900 rounded-lg border border-gray-700">
                <h3 className="font-bold text-white mb-2">Your Donation Link</h3>
                <p className="text-sm text-gray-400 mb-3">Share this with your viewers</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.donationLink}
                    readOnly
                    className="flex-1 bg-dark-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={copyDonationLink}
                    className={`px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors ${
                      copied ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'
                    }`}
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Warning about no filter */}
              <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30 flex items-start gap-3">
                <AlertTriangle size={24} className="text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-400">No Profanity Filter</h3>
                  <p className="text-sm text-yellow-200/80">
                    ChatScreamer allows any message content. Viewers who pay can say whatever they want.
                    You can manually skip messages during stream if needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tiers Tab */}
          {activeTab === 'tiers' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                <h3 className="font-bold text-white mb-2">💰 Pay More = More Obnoxious!</h3>
                <p className="text-sm text-gray-300">
                  Higher donations get louder voices, longer screen time, crazier animations, and more chaos.
                  It's their money, let them have fun!
                </p>
              </div>

              {tierEntries.map(([tierName, config]) => (
                <div
                  key={tierName}
                  className={`p-4 bg-gradient-to-r ${config.color} rounded-lg border ${config.border}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{config.label}</h3>
                      <p className="text-white/80 text-sm">
                        ${config.minAmount} - {config.maxAmount === Infinity ? '∞' : `$${config.maxAmount}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{config.duration / 1000}s</div>
                      <div className="text-xs text-white/60">screen time</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-black/20 rounded px-2 py-1">
                      <span className="text-white/60">Animation:</span>
                      <span className="text-white ml-1">{config.animation}</span>
                    </div>
                    <div className="bg-black/20 rounded px-2 py-1">
                      <span className="text-white/60">Sound:</span>
                      <span className="text-white ml-1">{config.soundEffect}</span>
                    </div>
                    <div className="bg-black/20 rounded px-2 py-1">
                      <span className="text-white/60">Voice Speed:</span>
                      <span className="text-white ml-1">{config.voiceSpeed}x</span>
                    </div>
                    <div className="bg-black/20 rounded px-2 py-1">
                      <span className="text-white/60">Repeats:</span>
                      <span className="text-white ml-1">{config.repeatMessage}x</span>
                    </div>
                  </div>

                  {(config.screenShake || config.fullScreenTakeover || config.confetti) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {config.screenShake && (
                        <span className="text-xs bg-red-500/30 text-red-200 px-2 py-0.5 rounded">🫨 SCREEN SHAKE</span>
                      )}
                      {config.fullScreenTakeover && (
                        <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded">📺 FULL SCREEN</span>
                      )}
                      {config.confetti && (
                        <span className="text-xs bg-yellow-500/30 text-yellow-200 px-2 py-0.5 rounded">🎊 CONFETTI</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sounds Tab */}
          {activeTab === 'sounds' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white mb-4">Sound Effects Library</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SOUND_EFFECTS.map(sound => (
                  <button
                    key={sound.id}
                    className="p-3 bg-dark-900 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{sound.name}</span>
                      <Play size={14} className="text-gray-500 group-hover:text-purple-400" />
                    </div>
                    <p className="text-xs text-gray-400">{sound.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-white mb-4">Voice Options</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {VOICE_OPTIONS.map(voice => (
                    <button
                      key={voice.id}
                      onClick={() => setSettings(s => ({ ...s, defaultVoice: voice.id }))}
                      className={`p-3 rounded-lg border transition-colors text-left ${
                        settings.defaultVoice === voice.id
                          ? 'bg-purple-900/50 border-purple-500'
                          : 'bg-dark-900 border-gray-700 hover:border-purple-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{voice.name}</span>
                        {settings.defaultVoice === voice.id && (
                          <CheckCircle size={14} className="text-purple-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{voice.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white mb-4">Animation Styles</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ANIMATIONS.map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => setSettings(s => ({ ...s, defaultAnimation: anim.id }))}
                    className={`p-3 rounded-lg border transition-colors text-left ${
                      settings.defaultAnimation === anim.id
                        ? 'bg-purple-900/50 border-purple-500'
                        : 'bg-dark-900 border-gray-700 hover:border-purple-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{anim.name}</span>
                      <Eye size={14} className="text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-400">{anim.description}</p>
                  </button>
                ))}
              </div>

              {/* Preview section */}
              <div className="mt-6 p-4 bg-dark-900 rounded-lg border border-gray-700">
                <h3 className="font-bold text-white mb-4">Preview</h3>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-gray-800">
                  <div className="text-center text-gray-500">
                    <Eye size={32} className="mx-auto mb-2" />
                    <p>Click "Test" to preview alerts</p>
                  </div>
                </div>
                <button className="mt-3 w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                  <Zap size={16} /> Test Alert
                </button>
              </div>
            </div>
          )}

          {/* Integration Tab */}
          {activeTab === 'integration' && (
            <div className="space-y-4">
              {/* Stripe */}
              <div className="p-4 bg-dark-900 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#635BFF] rounded-lg flex items-center justify-center">
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Stripe</h3>
                      <p className="text-sm text-gray-400">Accept credit card payments</p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg font-bold ${
                    settings.stripeConnected
                      ? 'bg-green-600'
                      : 'bg-[#635BFF] hover:bg-[#5851DB]'
                  }`}>
                    {settings.stripeConnected ? 'Connected' : 'Connect Stripe'}
                  </button>
                </div>
                {!settings.stripeConnected && (
                  <p className="text-xs text-gray-500">
                    Connect your Stripe account to receive payments directly.
                    Stripe charges 2.9% + $0.30 per transaction.
                  </p>
                )}
              </div>

              {/* PayPal */}
              <div className="p-4 bg-dark-900 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#003087] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      PP
                    </div>
                    <div>
                      <h3 className="font-bold text-white">PayPal</h3>
                      <p className="text-sm text-gray-400">Accept PayPal payments</p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg font-bold ${
                    settings.paypalConnected
                      ? 'bg-green-600'
                      : 'bg-[#003087] hover:bg-[#002569]'
                  }`}>
                    {settings.paypalConnected ? 'Connected' : 'Connect PayPal'}
                  </button>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="p-4 bg-dark-900 rounded-lg border border-gray-700">
                <h3 className="font-bold text-white mb-2">Webhook URL</h3>
                <p className="text-sm text-gray-400 mb-3">For custom integrations (StreamElements, etc.)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/api/chatscreamer/webhook/${streamerId}`}
                    readOnly
                    className="flex-1 bg-dark-800 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono"
                  />
                  <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded">
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* API Docs */}
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-3">
                  <ExternalLink size={20} className="text-purple-400" />
                  <div>
                    <h3 className="font-bold text-white">API Documentation</h3>
                    <p className="text-sm text-purple-200">
                      Build custom integrations with the ChatScreamer API
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-dark-900 border-t border-gray-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold flex items-center gap-2"
          >
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreamerSettings;
