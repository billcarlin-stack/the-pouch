/*
  The Pouch — Kanga AI Page
  A dedicated full-screen interface for the performance-focused AI agent.
*/

import { Sparkles, Info } from 'lucide-react';
import { DashboardKangaAI } from '../components/KangaChat';

const KangaAiPage = () => {
    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-nmfc-navy tracking-tight uppercase font-outfit">
                        Kanga <span className="text-nmfc-royal">AI</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">High-performance squad analytics & insights.</p>
                </div>

                <div className="flex items-center gap-3 bg-nmfc-royal/5 px-4 py-2 rounded-2xl border border-nmfc-royal/10">
                    <Sparkles size={18} className="text-nmfc-royal animate-pulse" />
                    <span className="text-xs font-black text-nmfc-royal uppercase tracking-widest leading-none">Powered by Data Lake</span>
                </div>
            </div>

            {/* Main Chat Interface */}
            <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] shadow-xl shadow-nmfc-navy/5 border border-gray-100 overflow-hidden flex flex-col">
                <div className="flex-1 p-8">
                    <DashboardKangaAI />
                </div>

                <div className="bg-gray-50 border-t border-gray-100 p-6 flex items-start gap-4">
                    <div className="bg-white p-2 rounded-xl border border-gray-200 text-gray-400">
                        <Info size={16} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-nmfc-navy uppercase tracking-widest mb-1">Knowledge Scope</h4>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                            KANGA.AI has real-time access to BigQuery squad data, including wellbeing surveys, match ratings,
                            injury status, and training loads. Ask about specific players or general squad trends.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KangaAiPage;
