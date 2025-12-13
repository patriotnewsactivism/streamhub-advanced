
import React, { useEffect, useState } from 'react';
import { User, UserPlan } from '../types';
import { X, Lock, Mail, User as UserIcon } from 'lucide-react';
import authService from '../services/authService';

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
  const [showDemoOption, setShowDemoOption] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDemoOption(false);
      setError(null);
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user: User;

      if (mode === 'login') {
        // Real login
        if (!email || !password) {
          setError("Email and password are required");
          setLoading(false);
          return;
        }

        user = await authService.login({ email, password });
      } else {
        // Real registration
        if (!email || !password || !name) {
          setError("All fields are required");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }

        user = await authService.register({
          email,
          username: name,
          password,
        });
      }

      // Success - call the callback with properly mapped user data
      onAuthSuccess({
        id: user.id,
        email: user.email,
        name: user.name || user.username || name, // Fallback to form name
        username: user.username,
        plan: user.plan,
        cloudHoursUsed: user.cloudHoursUsed || 0,
        cloudHoursLimit: user.cloudHoursLimit || (user.plan === 'admin' ? Infinity : 5),
      });

      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      onClose();
    } catch (err: any) {
      console.error('Authentication error:', err);
      const message = err?.message || 'Authentication failed';
      setError(message);
      const normalizedMessage = message.toLowerCase();
      if (
        normalizedMessage.includes('network') ||
        normalizedMessage.includes('server') ||
        normalizedMessage.includes('502') ||
        normalizedMessage.includes('503') ||
        normalizedMessage.includes('500')
      ) {
        setShowDemoOption(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper for Demo Buttons
  const quickLogin = (plan: UserPlan) => {
      const limits = {
          'always_free': 0,
          'free_trial': 5,
          'pro': 5,
          'business': 50,
          'admin': Infinity
      };
      const user: User = {
          id: `user-${plan}`,
          name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} User`,
          email: `${plan}@example.com`,
          plan: plan,
          cloudHoursUsed: 0,
          cloudHoursLimit: limits[plan]
      };
      onAuthSuccess(user);
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

        <form onSubmit={handleSubmit} className="px-8 pb-4 space-y-4">
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

        {/* Demo shortcuts - only show in development */}
        {(import.meta.env.DEV || showDemoOption) && (
          <div className="px-8 pb-4">
               <div className="text-[10px] text-center text-gray-500 uppercase font-bold mb-2 tracking-widest">Dev / Demo Shortcuts</div>
               <div className="grid grid-cols-3 gap-2">
                   <button onClick={() => quickLogin('always_free')} className="text-xs bg-dark-700 hover:bg-dark-600 p-2 rounded text-gray-300">Free Tier</button>
                   <button onClick={() => quickLogin('pro')} className="text-xs bg-brand-900/40 hover:bg-brand-900 p-2 rounded text-brand-400">Pro Plan</button>
                   <button onClick={() => quickLogin('business')} className="text-xs bg-purple-900/40 hover:bg-purple-900 p-2 rounded text-purple-400">Business</button>
               </div>
               {showDemoOption && (
                 <p className="text-[11px] text-center text-gray-400 mt-2">
                   Backend is unreachable right now. Use an instant demo login to explore ChatScreamer without waiting.
                 </p>
               )}
          </div>
        )}

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
      </div>
    </div>
  );
};

export default AuthModal;
