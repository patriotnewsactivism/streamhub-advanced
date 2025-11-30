
import React from 'react';
import { 
  Zap, Globe, Cpu, Smartphone, Layout, Mic, 
  ArrowRight, Play, Server, Shield, Sparkles, CheckCircle 
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans overflow-x-hidden selection:bg-brand-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-2 rounded-lg shadow-lg shadow-brand-500/20">
              <Zap size={24} className="text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight">StreamHub<span className="text-brand-400">Pro</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#cloud" className="hover:text-white transition-colors">Cloud VM</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Log In</button>
            <button 
              onClick={onLogin} 
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
            Stream Everywhere. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-brand-400 animate-gradient">From Anywhere.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The professional browser-based studio that creates a Virtual Machine in the cloud to handle your heavy lifting. Save mobile data while broadcasting 4K streams.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={onLogin} 
              className="w-full md:w-auto px-8 py-4 bg-white text-dark-900 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl"
            >
              Start Streaming Free <ArrowRight size={20} />
            </button>
            <button className="w-full md:w-auto px-8 py-4 bg-dark-800 border border-gray-700 text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-dark-700 transition-all">
              <Play size={20} fill="currentColor" /> Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Interface Preview */}
      <section className="px-4 pb-20 relative z-20">
        <div className="max-w-6xl mx-auto rounded-xl border border-gray-800 bg-dark-800/50 backdrop-blur-sm p-2 shadow-2xl">
          <div className="rounded-lg overflow-hidden relative aspect-video bg-black flex items-center justify-center group">
             {/* Mock UI */}
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626379953822-baec19c3accd?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                 <button onClick={onLogin} className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
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
             <div className="absolute bottom-8 right-8 bg-dark-900/90 backdrop-blur border border-gray-700 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow delay-75">
                 <div className="bg-red-500/20 p-2 rounded-lg text-red-500"><Globe size={20}/></div>
                 <div>
                     <div className="text-xs text-gray-400 uppercase font-bold">Live On</div>
                     <div className="text-sm font-bold text-white">YouTube + Twitch</div>
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
               icon={<Server className="text-green-400" size={32}/>}
               title="Cloud VM Engine"
               desc="Offload processing to our cloud servers. Stream 1080p video using 90% less data on your device."
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
      <section id="cloud" className="py-24 relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
                <div className="inline-block bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                    Game Changer
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Low Data Mode. <br/>High Quality Stream.</h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    Streaming directly from your phone burns battery and gigabytes of data. 
                    With <strong>Cloud VM</strong>, your phone becomes a remote control. 
                    We pull your video files directly from the cloud and stream them at high bitrate, 
                    while your phone sends tiny commands.
                </p>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-dark-800 p-4 rounded-xl border border-gray-800">
                        <Smartphone className="text-gray-500" size={32}/>
                        <div>
                            <div className="text-sm font-bold text-gray-500">Traditional Mobile Stream</div>
                            <div className="text-xl font-bold text-white">4.5 GB <span className="text-sm font-normal text-gray-500">/ hour</span></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-brand-900/20 p-4 rounded-xl border border-brand-500/30">
                        <Server className="text-brand-400" size={32}/>
                        <div>
                            <div className="text-sm font-bold text-brand-300">StreamHub Cloud VM</div>
                            <div className="text-xl font-bold text-white">0.05 GB <span className="text-sm font-normal text-gray-500">/ hour</span></div>
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
                             <Smartphone size={40} className="text-gray-400"/>
                             <span className="text-xs text-gray-500">You</span>
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
                             <span className="text-xs font-bold text-brand-400">Virtual Machine</span>
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

      {/* CTA Footer */}
      <section className="py-24 px-6 text-center border-t border-gray-800 bg-gradient-to-b from-dark-900 to-dark-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to go live?</h2>
          <p className="text-gray-400 text-lg mb-10">
            Join thousands of creators who have switched to the smarter way to stream.
          </p>
          <button 
            onClick={onLogin} 
            className="px-10 py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform"
          >
            Create Free Account
          </button>
          <p className="mt-6 text-sm text-gray-500">No credit card required for local streaming.</p>
        </div>
      </section>
      
      <footer className="py-8 text-center text-gray-600 text-sm border-t border-gray-800/50">
          &copy; {new Date().getFullYear()} StreamHub Pro. All rights reserved.
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
