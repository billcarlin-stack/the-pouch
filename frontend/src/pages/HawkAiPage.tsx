/*
  The Nest — Hawk AI Page
  A dedicated full-screen interface for the performance-focused AI agent.
*/

import { Sparkles } from 'lucide-react';

const HawkAiPage = () => {
    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-8 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-400/80 font-work">Elite Insights</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                        Hawk <span className="text-gold-400">AI</span>
                    </h1>
                    <p className="text-white/50 font-medium text-sm font-work italic">High-performance squad analytics & strategy.</p>
                </div>

                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-lg group">
                    <Sparkles size={18} className="text-gold-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-gold-400 uppercase tracking-widest leading-none font-work">Powered by Data Lake</span>
                </div>
            </div>

            {/* Coming Soon Interface */}
            <div className="flex-1 min-h-0 bg-[#1A1411] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col items-center justify-center p-12 text-center relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-400/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>
                
                <div className="max-w-md space-y-8 relative z-10">
                    <div className="bg-gold-400/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-gold-500/10 border border-gold-400/20">
                        <Sparkles size={48} className="text-gold-400 animate-pulse" />
                    </div>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tight font-space">Coming Soon</h2>
                    <p className="text-white/50 font-work leading-relaxed">
                        We're upgrading Hawk AI with the latest strategic intelligence to provide even deeper tactical insights into squad performance.
                    </p>
                    <div className="pt-8">
                        <div className="inline-flex items-center gap-3 bg-gold-500/10 text-gold-400 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] font-work border border-gold-400/20">
                            <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping"></span>
                            Migration in Progress
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HawkAiPage;
