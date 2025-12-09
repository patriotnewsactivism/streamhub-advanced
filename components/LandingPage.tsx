import React, { useState } from 'react';
import { User } from '../types';
import AuthModal from './AuthModal';
import { 
  Zap, Globe, Cpu, Smartphone, Layout, Mic, 
  ArrowRight, Play, Server, Shield, Sparkles, CheckCircle, X, Check, Cloud, Database 
} from 'lucide-react';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const handleOpenAuth = (mode: 'login' | 'signup') => {
      setAuthMode(mode);
      setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans overflow-x-hidden selection:bg-brand-500 selection:text-white">
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={onLogin}
        initialMode={authMode}
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col items-start cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-500 via-white to-blue-500 bg-clip-text text-transparent drop-shadow-lg" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>ChatScream</span>
            <span className="text-[10px] font-medium text-gray-400 tracking-widest uppercase -mt-1">by We The People News</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#cloud" className="hover:text-white transition-colors">Cloud Import</a>
            <a href="#compare" className="hover:text-white transition-colors">Compare</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handleOpenAuth('login')} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Log In</button>
            <button 
              onClick={() => handleOpenAuth('signup')} 
              className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-600/20 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] -z-10 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/30 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
            <Sparkles size={12} /> The Future of Live Streaming
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Stream Directly From Cloud. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-brand-400 animate-gradient">Zero Data Usage.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Link your Google Drive, Dropbox, or S3 files and broadcast 4K video directly from the cloud. Your phone is just the remote.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => handleOpenAuth('signup')} 
              className="w-full md:w-auto px-8 py-4 bg-white text-dark-900 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl"
            >
              Start Free Trial <ArrowRight size={20} />
            </button>
            <button onClick={() => window.open('https://youtube.com', '_blank')} className="w-full md:w-auto px-8 py-4 bg-dark-800 border border-gray-700 text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-dark-700 transition-all">
              <Play size={20} fill="currentColor" /> Watch Demo
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">7-Day Free Trial • No Credit Card Required for Signup</p>
        </div>
      </section>

      {/* Interface Preview */}
      <section className="px-4 pb-20 relative z-20">
        <div className="max-w-6xl mx-auto rounded-xl border border-gray-800 bg-dark-800/50 backdrop-blur-sm p-2 shadow-2xl">
          <div className="rounded-lg overflow-hidden relative aspect-video bg-black flex items-center justify-center group border border-gray-800">
             {/* Mock UI */}
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626379953822-baec19c3accd?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                 <button onClick={() => handleOpenAuth('signup')} className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
                    <Play size={32} fill="white" className="ml-1" />
                 </button>
             </div>
             {/* Floating Badges */}
             <div className="absolute top-8 left-8 bg-dark-900/90 backdrop-blur border border-gray-700 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow">
                 <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><Server size={20}/></div>
                 <div>
                     <div className="text-xs text-gray-400 uppercase font-bold">Cloud VM</div>
                     <div className="text-sm font-bold text-white">Active • 6000 kbps</div>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to go live.</h2>
             <p className="text-gray-400 text-lg">Professional tools without the expensive desktop rig.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             <FeatureCard 
               icon={<Globe className="text-blue-400" size={32}/>}
               title="Multi-Stream"
               desc="Broadcast to YouTube, Facebook, Twitch, and Custom RTMP simultaneously with a single click."
             />
             <FeatureCard 
               icon={<Layout className="text-purple-400" size={32}/>}
               title="Pro Layouts"
               desc="Switch between PIP, Split Screen, and Newsroom templates instantly. Drag, drop, and resize."
             />
             <FeatureCard 
               icon={<Sparkles className="text-yellow-400" size={32}/>}
               title="AI Assistant"
               desc="Let our Gemini-powered AI generate viral titles, descriptions, and hashtags for your stream."
             />
             <FeatureCard 
               icon={<Cloud className="text-green-400" size={32}/>}
               title="Direct Cloud Import"
               desc="Stream directly from Google Drive, Dropbox, OneDrive, or S3. Link a signed-in account to verify and go live."
             />
             <FeatureCard 
               icon={<Mic className="text-pink-400" size={32}/>}
               title="Audio Mixing"
               desc="Professional audio routing. Mix your mic, system audio, and video clips like a DJ."
             />
             <FeatureCard 
               icon={<Shield className="text-brand-400" size={32}/>}
               title="Reliable & Secure"
               desc="No more dropped frames. Our cloud infrastructure ensures a stable stream even on weak 4G."
             />
          </div>
        </div>
      </section>

      {/* Cloud Spotlight Section */}
      <section id="cloud" className="py-24 relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 border-y border-gray-800">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
                <div className="inline-block bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                    Game Changer
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Direct Cloud Streaming. <br/>Any Source.</h2>
                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                    Forget about bandwidth limitations. Connect directly to your files on 
                    <span className="text-white font-bold"> Google Drive, Dropbox, OneDrive, Box, Google Cloud, or AWS S3</span>.
                </p>
                
                <div className="mb-8 p-5 bg-dark-800 rounded-xl border border-gray-700 shadow-inner">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-brand-500 mt-1 shrink-0" size={20} />
                        <div>
                            <h4 className="text-white font-bold mb-1">Secure Link Verification</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Simply provide a link from an account you are actively signed into (to verify ownership). 
                                We securely pull the video stream and broadcast it at full quality, bypassing your local device entirely.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-dark-800 p-4 rounded-xl border border-gray-800">
                        <Smartphone className="text-gray-500" size={32}/>
                        <div>
                            <div className="text-sm font-bold text-gray-500">Traditional Upload</div>
                            <div className="text-xl font-bold text-white">High Data Usage <span className="text-sm font-normal text-gray-500">(Phone Battery Drain)</span></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-brand-900/20 p-4 rounded-xl border border-brand-500/30">
                        <Cloud className="text-brand-400" size={32}/>
                        <div>
                            <div className="text-sm font-bold text-brand-300">Direct Cloud Stream</div>
                            <div className="text-xl font-bold text-white">Zero Data Usage <span className="text-sm font-normal text-gray-500">(Cloud-to-Cloud)</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="order-1 md:order-2 relative">
                <div className="absolute inset-0 bg-brand-500/20 blur-[100px] rounded-full"></div>
                <div className="relative bg-dark-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="text-sm font-bold text-gray-400">CLOUD CONTROLLER</div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    {/* Visual representation of data flow */}
                    <div className="flex justify-between items-center mb-12">
                         <div className="flex flex-col items-center gap-2">
                             <Database size={40} className="text-gray-400"/>
                             <span className="text-xs text-gray-500">Storage</span>
                         </div>
                         <div className="flex-1 h-1 bg-gray-700 mx-4 relative overflow-hidden">
                             <div className="absolute inset-y-0 left-0 w-full bg-brand-500/50 animate-[shimmer_2s_infinite]"></div>
                             <div className="absolute top-0 bottom-0 bg-brand-500 w-2 animate-[slide_2s_infinite]"></div>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             <div className="relative">
                                <Server size={48} className="text-brand-400"/>
                                <Cpu size={20} className="absolute -top-2 -right-2 text-white bg-brand-600 rounded-full p-1"/>
                             </div>
                             <span className="text-xs font-bold text-brand-400">VM Engine</span>
                         </div>
                         <div className="flex-1 h-2 bg-gray-700 mx-4 relative overflow-hidden rounded-full">
                             <div className="absolute inset-y-0 left-0 w-full bg-green-500 animate-[shimmer_0.5s_infinite]"></div>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             <Globe size={40} className="text-purple-400"/>
                             <span className="text-xs text-gray-500">World</span>
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-900 p-3 rounded border border-gray-800 text-center">
                            <div className="text-2xl font-bold text-green-400">98%</div>
                            <div className="text-xs text-gray-500 uppercase">Data Saved</div>
                        </div>
                         <div className="bg-dark-900 p-3 rounded border border-gray-800 text-center">
                            <div className="text-2xl font-bold text-blue-400">1080p</div>
                            <div className="text-xs text-gray-500 uppercase">Quality</div>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Comparison Section */}
      <section id="compare" className="py-24 bg-dark-900">
         <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-bold mb-4">Compare & Conquer</h2>
                 <p className="text-gray-400 text-lg">See why ChatScream is the smart choice.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-800 shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-dark-800 text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-6 font-medium">Feature</th>
                            <th className="p-6 font-bold text-white bg-brand-900/20 border-b-2 border-brand-500 w-1/4">ChatScream</th>
                            <th className="p-6 font-medium w-1/4">StreamYard (Basic)</th>
                            <th className="p-6 font-medium w-1/4">OneStream (Standard)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-dark-800/50">
                        <tr>
                            <td className="p-6 font-medium text-white">Monthly Price</td>
                            <td className="p-6 font-bold text-brand-400 text-xl bg-brand-900/10">$29.99</td>
                            <td className="p-6 text-gray-400">$25.00</td>
                            <td className="p-6 text-gray-400">$39.00</td>
                        </tr>
                        <tr>
                            <td className="p-6 font-medium text-white">Direct Cloud Streaming (S3/Drive)</td>
                            <td className="p-6 bg-brand-900/10"><CheckCircle className="text-green-500 inline mr-2"/> Included</td>
                            <td className="p-6"><X className="text-red-500 inline mr-2"/> No</td>
                            <td className="p-6"><CheckCircle className="text-green-500 inline mr-2"/> Pre-recorded only</td>
                        </tr>
                        <tr>
                            <td className="p-6 font-medium text-white">Multi-Destinations</td>
                            <td className="p-6 bg-brand-900/10"><span className="font-bold text-white">Unlimited</span></td>
                            <td className="p-6">3 Destinations</td>
                            <td className="p-6">Social Media Only</td>
                        </tr>
                        <tr>
                            <td className="p-6 font-medium text-white">AI Assistant (Gemini)</td>
                            <td className="p-6 bg-brand-900/10"><CheckCircle className="text-green-500 inline mr-2"/> Yes</td>
                            <td className="p-6"><X className="text-gray-600 inline mr-2"/> No</td>
                            <td className="p-6"><X className="text-gray-600 inline mr-2"/> No</td>
                        </tr>
                        <tr>
                            <td className="p-6 font-medium text-white">Custom RTMP</td>
                            <td className="p-6 bg-brand-900/10"><CheckCircle className="text-green-500 inline mr-2"/> Yes</td>
                            <td className="p-6"><CheckCircle className="text-green-500 inline mr-2"/> Yes</td>
                            <td className="p-6"><CheckCircle className="text-green-500 inline mr-2"/> Yes</td>
                        </tr>
                    </tbody>
                </table>
            </div>
         </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/20 to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4">Simple, Scalable Pricing</h2>
          <p className="text-gray-400 text-lg mb-12">Start free, upgrade for power.</p>
          
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
             {/* Always Free Card */}
             <div className="bg-dark-800 rounded-3xl p-8 border border-gray-700 flex flex-col items-center hover:border-gray-500 transition-colors">
                 <h3 className="text-xl font-bold text-gray-300 mb-2">Always Free</h3>
                 <div className="text-4xl font-bold text-white mb-6">$0</div>
                 <ul className="space-y-4 text-left w-full mb-8 text-gray-400 text-sm">
                     <li className="flex gap-2"><Check size={16} className="text-white"/> Full Studio Access</li>
                     <li className="flex gap-2"><Check size={16} className="text-white"/> 1 Streaming Destination</li>
                     <li className="flex gap-2"><X size={16} className="text-red-500"/> No Cloud VM Access</li>
                     <li className="flex gap-2"><X size={16} className="text-red-500"/> ChatScream Watermark</li>
                 </ul>
                 <button onClick={() => handleOpenAuth('signup')} className="mt-auto w-full py-3 rounded-xl border border-gray-600 text-white font-bold hover:bg-gray-700 transition-colors">
                     Get Started
                 </button>
             </div>

             {/* Pro Card */}
             <div className="bg-gradient-to-b from-brand-900 to-dark-900 rounded-3xl p-8 border border-brand-500 flex flex-col items-center shadow-2xl relative overflow-hidden transform md:-translate-y-4">
                 <div className="absolute top-0 inset-x-0 h-1 bg-brand-400 shadow-[0_0_20px_rgba(56,189,248,0.5)]"></div>
                 <div className="bg-brand-500 text-xs font-bold text-white px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Most Popular</div>
                 <h3 className="text-xl font-bold text-brand-400 mb-2">Pro Plan</h3>
                 <div className="text-5xl font-bold text-white mb-2">$29.99<span className="text-lg text-gray-400 font-normal">/mo</span></div>
                 <p className="text-gray-400 text-sm mb-6">Everything for serious creators.</p>
                 
                 <ul className="space-y-4 text-left w-full mb-8 text-gray-200 text-sm">
                     <li className="flex gap-2"><CheckCircle size={16} className="text-brand-400"/> <strong>Unlimited</strong> Destinations</li>
                     <li className="flex gap-2"><CheckCircle size={16} className="text-brand-400"/> <strong>5 Hours</strong> Cloud VM Usage</li>
                     <li className="flex gap-2"><CheckCircle size={16} className="text-brand-400"/> No Watermark</li>
                     <li className="flex gap-2"><CheckCircle size={16} className="text-brand-400"/> 1080p Full HD</li>
                 </ul>
                 <button onClick={() => handleOpenAuth('signup')} className="mt-auto w-full py-4 rounded-xl bg-brand-600 text-white font-bold shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform">
                     Start 7-Day Trial
                 </button>
             </div>

             {/* Business Card */}
             <div className="bg-dark-800 rounded-3xl p-8 border border-purple-500/30 flex flex-col items-center hover:border-purple-500 transition-colors">
                 <h3 className="text-xl font-bold text-purple-400 mb-2">Business</h3>
                 <div className="text-4xl font-bold text-white mb-6">$59.99<span className="text-lg text-gray-400 font-normal">/mo</span></div>
                 <ul className="space-y-4 text-left w-full mb-8 text-gray-400 text-sm">
                     <li className="flex gap-2"><Check size={16} className="text-white"/> <strong>Unlimited</strong> Destinations</li>
                     <li className="flex gap-2"><Check size={16} className="text-white"/> <strong>50 Hours</strong> Cloud VM Usage</li>
                     <li className="flex gap-2"><Check size={16} className="text-white"/> Priority 24/7 Support</li>
                     <li className="flex gap-2"><Check size={16} className="text-white"/> Team Roles (Coming Soon)</li>
                 </ul>
                 <button onClick={() => handleOpenAuth('signup')} className="mt-auto w-full py-3 rounded-xl border border-purple-500/50 text-white font-bold hover:bg-purple-900/20 transition-colors">
                     Get Business
                 </button>
             </div>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-gray-600 text-sm border-t border-gray-800/50 bg-dark-900">
          &copy; {new Date().getFullYear()} ChatScream by We The People News. All rights reserved.
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-dark-900 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1 hover:shadow-xl">
    <div className="mb-6 bg-dark-800 w-16 h-16 rounded-xl flex items-center justify-center border border-gray-700">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm">
      {desc}
    </p>
  </div>
);

export default LandingPage;