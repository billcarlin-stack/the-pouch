import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Send, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HawkChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: "G'day Coach. I'm Hawk-AI. Ask me about player form, stats, or comparisons." }
    ]);
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery('');
        setLoading(true);

        try {
            const res = await api.post('/chat', { query: userMsg });
            setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I lost connection to the mainframe." }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 h-14 w-14 bg-hfc-brown text-white rounded-full shadow-elite flex items-center justify-center z-50 transition-all ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <Bot size={28} />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#1A1411] border border-white/10 rounded-2xl flex flex-col shadow-2xl z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02] rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <div className="bg-hfc-brown p-1.5 rounded-lg text-white">
                                    <Bot size={20} />
                                </div>
                                <h3 className="font-bold text-white">Hawk-AI</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${m.role === 'user'
                                        ? 'bg-hfc-brown text-white rounded-br-none'
                                        : 'bg-white/5 border border-white/10 text-white/80 rounded-bl-none'
                                        }`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl rounded-bl-none">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-[#0F0A07]/40 rounded-b-2xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ask about stats or players..."
                                    className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/20 transition-all font-medium text-sm text-white placeholder:text-white/30"
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim() || loading}
                                    className="absolute right-2 top-2 p-1.5 bg-hfc-brown text-white rounded-lg hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default HawkChat;
