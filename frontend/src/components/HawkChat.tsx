import { useState, useRef, useEffect } from 'react';
import { ApiService } from '../services/api';
import { Send, Bot, Sparkles, ArrowUp } from 'lucide-react';

interface Message {
    text: string;
    sender: 'ai' | 'user';
}

// === Existing HawkChat (sidebar/dedicated page version) ===
export const HawkChat = () => {
    const [messages, setMessages] = useState<Message[]>([
        { text: "G'day! I'm KANGA.AI, your high-performance assistant. Ask me anything about squad wellbeing or ratings.", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([
        "Who had the lowest sleep?",
        "Injury status?",
        "Top training rating?"
    ]);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        setMessages(prev => [...prev, { text, sender: 'user' }]);
        setInput('');
        setLoading(true);

        try {
            const response = await ApiService.askAI(text);
            setMessages(prev => [...prev, { text: response.answer, sender: 'ai' }]);
            if (response.suggestions) setSuggestions(response.suggestions);
        } catch (err) {
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting to the data lake.", sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px] overflow-hidden">
            {/* Header */}
            <div className="bg-hfc-brown p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <div className="bg-hfc-brown p-2 rounded-lg">
                        <Bot size={20} className="text-gold-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">KANGA.AI</h3>
                        <p className="text-[10px] text-amber-200 uppercase tracking-widest">Performance Agent</p>
                    </div>
                </div>
                <Sparkles size={16} className="text-gold-400 animate-pulse" />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender === 'user'
                            ? 'bg-hfc-brown text-white rounded-tr-none'
                            : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none'
                            }`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start italic text-gray-400 text-xs animate-pulse">
                        Hawk is thinking...
                    </div>
                )}
            </div>

            {/* Footer / Input */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex flex-wrap gap-2 mb-4">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(s)}
                            className="text-[10px] font-medium bg-gray-50 hover:bg-gold-50 hover:text-gold-700 text-gray-500 py-1 px-3 rounded-full border border-gray-100 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask KANGA.AI..."
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hfc-brown/20"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-hfc-brown text-white p-2 rounded-xl hover:bg-hfc-brown transition-colors disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};


// === DashboardHawkAI — Gemini-style interface for the Dashboard ===
const SUGGESTIONS = [
    "Who's at risk this week?",
    "Lowest sleep scores?",
    "Top rated players?",
    "Any injury concerns?",
    "Squad readiness summary",
];

export const DashboardHawkAI = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current && hasStarted) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, hasStarted]);

    const handleSend = async (text: string) => {
        if (!text.trim() || loading) return;
        setHasStarted(true);
        setMessages(prev => [...prev, { text, sender: 'user' }]);
        setInput('');
        setLoading(true);

        try {
            const response = await ApiService.askAI(text);
            setMessages(prev => [...prev, { text: response.answer, sender: 'ai' }]);
        } catch {
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting to the data lake.", sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">

            {/* === START SCREEN === */}
            {!hasStarted && (
                <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 gap-6">
                    {/* Branding */}
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-hfc-brown to-hfc-brown flex items-center justify-center shadow-xl shadow-hfc-brown/30">
                                <Sparkles size={26} className="text-gold-400" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-hfc-brown tracking-tight">
                                KANGA<span className="text-hfc-brown">.</span>AI
                            </h2>
                            <p className="text-gray-400 text-xs font-medium mt-1 tracking-wide">
                                Your intelligent squad performance assistant
                            </p>
                        </div>
                    </div>

                    {/* Suggestion chips */}
                    <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(s)}
                                className="text-xs font-medium bg-gray-50 hover:bg-hfc-brown hover:text-white text-gray-600 border border-gray-200 px-3.5 py-1.5 rounded-full transition-all duration-200 hover:border-hfc-brown hover:shadow-sm"
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Gemini-style searchbar */}
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                        className="w-full max-w-md"
                    >
                        <div className="relative group">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask KANGA.AI anything about the squad..."
                                className="w-full bg-white border-2 border-gray-200 group-hover:border-gray-300 focus:border-hfc-brown rounded-2xl py-4 pl-5 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:shadow-lg focus:shadow-hfc-brown/10 transition-all duration-300 shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-hfc-brown text-white flex items-center justify-center hover:bg-hfc-brown transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
                            >
                                <ArrowUp size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* === CHAT MODE === */}
            {hasStarted && (
                <>
                    {/* Compact header */}
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 shrink-0">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-hfc-brown to-hfc-brown flex items-center justify-center">
                            <Sparkles size={13} className="text-gold-400" />
                        </div>
                        <span className="font-black text-hfc-brown text-sm tracking-tight">KANGA.AI</span>
                        <div className="ml-auto flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
                    >
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.sender === 'ai' && (
                                    <div className="h-6 w-6 rounded-lg bg-hfc-brown flex items-center justify-center shrink-0 mt-0.5">
                                        <Sparkles size={10} className="text-gold-400" />
                                    </div>
                                )}
                                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.sender === 'user'
                                    ? 'bg-hfc-brown text-white rounded-tr-sm font-medium'
                                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'
                                    }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-2 justify-start items-center">
                                <div className="h-6 w-6 rounded-lg bg-hfc-brown flex items-center justify-center">
                                    <Sparkles size={10} className="text-gold-400 animate-pulse" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                                    <div className="flex gap-1 items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-hfc-brown animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="h-1.5 w-1.5 rounded-full bg-hfc-brown animate-bounce" style={{ animationDelay: '120ms' }} />
                                        <div className="h-1.5 w-1.5 rounded-full bg-hfc-brown animate-bounce" style={{ animationDelay: '240ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat input */}
                    <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                            className="relative"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a follow-up..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hfc-brown/20 focus:border-hfc-brown/40 transition-all"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-hfc-brown flex items-center justify-center text-white hover:bg-hfc-brown transition-colors disabled:opacity-30"
                            >
                                <ArrowUp size={15} />
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};
