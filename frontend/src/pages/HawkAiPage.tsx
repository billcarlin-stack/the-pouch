/*
  The Nest — Hawk AI Page
  A dedicated full-screen interface for the performance-focused AI agent.
*/

import { Sparkles } from 'lucide-react';

const HawkAiPage = () => {
    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-hfc-brown tracking-tight uppercase font-outfit">
                        Hawk <span className="text-hfc-brown">AI</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">High-performance squad analytics & insights.</p>
                </div>

                <div className="flex items-center gap-3 bg-hfc-brown/5 px-4 py-2 rounded-2xl border border-hfc-brown/10">
                    <Sparkles size={18} className="text-hfc-brown animate-pulse" />
                    <span className="text-xs font-black text-hfc-brown uppercase tracking-widest leading-none">Powered by Data Lake</span>
                </div>
            </div>

            {/* Coming Soon Interface */}
            <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] shadow-xl shadow-hfc-brown/5 border border-gray-100 overflow-hidden flex flex-col items-center justify-center p-12 text-center">
                <div className="max-w-md space-y-6">
                    <div className="bg-hfc-brown/5 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <Sparkles size={40} className="text-hfc-brown animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black text-hfc-brown uppercase tracking-tight">Coming Soon</h2>
                    <p className="text-gray-500 font-medium">
                        We're upgrading Hawk AI with the latest intelligence to provide even deeper insights into squad performance.
                    </p>
                    <div className="pt-8">
                        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                            Migration in Progress
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HawkAiPage;
