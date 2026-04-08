import { type FormEvent, useState } from 'react';
import { api } from '../services/api';
import { Bot, Search } from 'lucide-react';
import { clsx } from 'clsx';

const TEAMS = [
    { id: 'ADE', name: 'Adelaide Crows' },
    { id: 'BL', name: 'Brisbane Lions' },
    { id: 'CAR', name: 'Carlton' },
    { id: 'COL', name: 'Collingwood' },
    { id: 'ESS', name: 'Essendon' },
    { id: 'FRE', name: 'Fremantle' },
    { id: 'GEL', name: 'Geelong Cats' },
    { id: 'GC', name: 'Gold Coast Suns' },
    { id: 'GWS', name: 'GWS Giants' },
    { id: 'MEL', name: 'Melbourne' },
    { id: 'NM', name: 'North Melbourne' },
    { id: 'PA', name: 'Port Adelaide' },
    { id: 'RIC', name: 'Richmond' },
    { id: 'STK', name: 'St Kilda' },
    { id: 'SYD', name: 'Sydney Swans' },
    { id: 'WCE', name: 'West Coast Eagles' },
    { id: 'WB', name: 'Western Bulldogs' },
];

export const OppositionPreviews = () => {
    const [selectedTeam, setSelectedTeam] = useState(TEAMS[0].id);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
        { role: 'ai', text: `Select an opposition team and ask me anything from the scout reports.` }
    ]);
    const [loading, setLoading] = useState(false);

    const handleAsk = async (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery('');
        setLoading(true);

        try {
            // Using a new dedicated route for Opposition AI
            const res = await api.post('/opposition/ask', { 
                team: selectedTeam, 
                question: userMsg 
            });
            setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Error accessing the scout database or AI agent. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-[1200px] mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="h-[1px] w-10 bg-gold-400/40"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Hawk AI Scout Integration</span>
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                    Opposition <span className="text-gold-400">Previews</span>
                </h1>
            </div>

            <div className="bg-[#1A1411] rounded-[3rem] shadow-2xl border border-white/5 flex flex-col md:flex-row min-h-[600px] overflow-hidden relative group/container">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                {/* Sidebar for Team Selection */}
                <div className="w-full md:w-80 border-r border-white/5 bg-white/[0.02] p-8 flex flex-col relative z-10">
                    <h2 className="text-[10px] font-black text-gold-400/40 uppercase tracking-[0.3em] mb-6 font-space">Select Opponent</h2>
                    <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-4">
                        {TEAMS.map(team => (
                            <button
                                key={team.id}
                                onClick={() => setSelectedTeam(team.id)}
                                className={clsx(
                                    "w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300 font-work",
                                    selectedTeam === team.id
                                        ? "bg-gold-500/10 text-gold-400 border border-gold-400/30 shadow-[0_0_20px_rgba(246,176,0,0.1)]"
                                        : "bg-white/5 border border-white/5 text-white/50 hover:border-gold-400/20 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {team.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI Chat Area */}
                <div className="flex-1 flex flex-col bg-[#0F0A07] relative z-10">
                    <div className="p-8 border-b border-white/5 flex items-center gap-5 bg-white/[0.01]">
                        <div className="bg-gold-400/10 p-4 rounded-2xl text-gold-400 border border-gold-400/20 shadow-lg">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white font-space uppercase tracking-tight">Hawk AI Scout</h2>
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] font-work mt-2">
                                Currently querying: <span className="text-gold-400">{TEAMS.find(t => t.id === selectedTeam)?.name}</span>
                            </p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={clsx("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={clsx(
                                    "max-w-[80%] rounded-[1.5rem] p-6 text-sm font-medium leading-relaxed font-work",
                                    m.role === 'user' 
                                        ? "bg-gold-500 text-[#0F0A07] rounded-tr-none shadow-lg shadow-gold-500/10" 
                                        : "bg-white/5 border border-white/5 text-white/90 rounded-tl-none shadow-sm italic"
                                )}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-6 rounded-tl-none shadow-sm">
                                    <div className="flex gap-2 items-center h-5">
                                        <span className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-bounce"></span>
                                        <span className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                        <span className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                        <form onSubmit={handleAsk} className="relative flex items-center group">
                            <div className="absolute inset-0 bg-gold-400/5 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                            <Search className="absolute left-6 text-white/20 group-focus-within:text-gold-400 transition-colors z-10" size={20} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`PROBE DATABASE ON ${TEAMS.find(t => t.id === selectedTeam)?.name.toUpperCase()}...`}
                                className="w-full pl-16 pr-40 py-5 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 transition-all placeholder:text-white/20 font-work relative z-10"
                            />
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="absolute right-3 px-8 py-3.5 bg-gold-500 text-[#0F0A07] font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_5px_15px_rgba(246,176,0,0.3)] z-10 font-work"
                            >
                                Query
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OppositionPreviews;
