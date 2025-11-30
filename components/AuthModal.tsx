
import React, { useState } from 'react';
import { User, UserPlan } from '../types';
import { X, Lock, Mail, User as UserIcon, CheckCircle, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate API Latency
    setTimeout(() => {
      setLoading(false);

      // 1. ADMIN BYPASS CHECK
      if (email.toLowerCase() === 'admin@streamhub.com' && password === 'password') {
        const adminUser: User = {
          id: 'admin-001',
          name: 'Master Admin',
          email: 'admin@streamhub.com',
          plan: 'admin',
          cloudHoursUsed: 0,
          cloudHoursLimit: Infinity
        };
        onAuthSuccess(adminUser);
        return;
      }

      // 2. Signup Flow
      if (mode === 'signup') {
        if (!email || !password || !name) {
          setError("All fields are required.");
          return;
        }
        
        // Create 7-Day Free Trial User
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        const newUser: User = {
          id: `user-${Date.now()}`,
          name: name,
          email: email,
          plan: 'free_trial',
          trialEndDate: trialEndDate.toISOString(),
          cloudHoursUsed: 0,
          cloudHoursLimit: 5 // 5 Hours included in trial
        };
        onAuthSuccess(newUser);
      } 
      
      // 3. Login Flow (Mock)
      else {
         if (email && password) {
             // Mock returning user
             const returningUser: User = {
                 id: 'user-returning',
                 name: 'Streamer Pro',
                 email: email,
                 plan: 'pro',
                 cloudHoursUsed: 1.2,
                 cloudHoursLimit: 50
             };
             onAuthSuccess(returningUser);
         } else {
             setError("Invalid credentials");
         }
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
        
        <div className="p-8 text-center">
             <h2 className="text-2xl font-bold mb-2">
                 {mode === 'login' ? 'Welcome Back' : 'Start Your Free Trial'}
             </h2>
             <p className="text-gray-400 text-sm">
                 {mode === 'login' ? 'Log in to your studio dashboard.' : 'Get 7 days of Pro features & 5 cloud hours free.'}
             </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {mode === 'signup' && (
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Full Name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-dark-900 border border-gray-700 rounded-lg pl-10 py-3 text-white focus:border-brand-500 outline-none"
                    />
                </div>
            )}

            <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-dark-900 border border-gray-700 rounded-lg pl-10 py-3 text-white focus:border-brand-500 outline-none"
                />
            </div>

            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark-900 border border-gray-700 rounded-lg pl-10 py-3 text-white focus:border-brand-500 outline-none"
                />
            </div>

            {error && <div className="text-red-500 text-sm font-bold text-center">{error}</div>}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-brand-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Create Account')}
            </button>
        </form>

        <div className="p-4 bg-dark-900 border-t border-gray-800 text-center">
            {mode === 'login' ? (
                <p className="text-sm text-gray-400">
                    New here? <button onClick={() => setMode('signup')} className="text-brand-400 font-bold hover:underline">Start Free Trial</button>
                </p>
            ) : (
                <p className="text-sm text-gray-400">
                    Already have an account? <button onClick={() => setMode('login')} className="text-brand-400 font-bold hover:underline">Log In</button>
                </p>
            )}
        </div>

        {/* Demo Hint */}
        <div className="absolute bottom-1 right-2 opacity-10 hover:opacity-100 transition-opacity">
            <div className="text-[10px] text-gray-500 flex flex-col items-end">
                <span className="flex items-center gap-1 font-bold"><ShieldAlert size={10}/> Admin Bypass</span>
                <span>u: admin@streamhub.com</span>
                <span>p: password</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
