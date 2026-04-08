/*
  The Nest — Daily Schedule Widget
  Replaces HawkAI on the dashboard sidebar.
*/

import { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronRight, Info } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

export const DailySchedule = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchToday = async () => {
            if (!user) return;
            const today = new Date().toISOString().split('T')[0];
            try {
                const data = await ApiService.getCalendarEvents({
                    start_date: today + 'T00:00:00Z',
                    end_date: today + 'T23:59:59Z',
                    player_id: user.jumper_no || undefined
                });
                setEvents(data);
            } catch (err) {
                console.error("Failed to load daily schedule", err);
            } finally {
                setLoading(false);
            }
        };

        fetchToday();
    }, [user]);

    const getTypeStyles = (type: string | null | undefined) => {
        const t = (type || '').toLowerCase();
        switch (t) {
            case 'main session': return 'bg-gold-500/10 text-gold-400 border-gold-400/20 shadow-[0_0_10px_rgba(246,176,0,0.1)]';
            case 'weights': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'rehab': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'media': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-white/5 text-white/60 border-white/10';
        }
    };

    return (
        <div className="premium-card p-8 h-full flex flex-col group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-gold-400/10 transition-colors duration-1000"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-gold-400/10 p-3 rounded-2xl text-gold-400 border border-gold-400/20">
                        <Calendar size={22} />
                    </div>
                    <div>
                        <h3 className="font-black text-white uppercase tracking-tight text-base font-space">Today's Schedule</h3>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] leading-none mt-2 font-work">
                            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 relative z-10">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
                    ))
                ) : events.length > 0 ? (
                    events.map((event, i) => (
                        <div key={i} className="group/item cursor-pointer">
                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] hover:bg-white/[0.05] hover:border-gold-400/30 transition-all duration-300 relative overflow-hidden group">
                                <div className={clsx(
                                    "absolute left-0 top-0 bottom-0 w-1 rounded-full",
                                    event.type?.toLowerCase() === 'main session' ? 'bg-gold-500 shadow-[0_0_10px_rgba(246,176,0,0.5)]' :
                                        event.type?.toLowerCase() === 'weights' ? 'bg-indigo-500' :
                                            event.type?.toLowerCase() === 'rehab' ? 'bg-rose-500' : 'bg-white/20'
                                )} />

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0 ml-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={clsx(
                                                "text-[8px] font-black uppercase px-2.5 py-1 rounded-full border",
                                                getTypeStyles(event.type)
                                            )}>
                                                {event.type}
                                            </span>
                                            <span className="text-[10px] font-bold text-white/30 flex items-center gap-1.5 font-work italic">
                                                <Clock size={11} className="shrink-0" />
                                                {new Date(event.start_time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-white text-[15px] truncate group-hover/item:text-gold-400 transition-colors font-space tracking-tight uppercase">
                                            {event.title}
                                        </h4>
                                    </div>
                                    <ChevronRight size={18} className="text-white/10 group-hover/item:text-gold-400 transform group-hover/item:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-10 opacity-20 relative z-10">
                        <Info size={40} className="mb-4 text-white" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] font-work">No tasks assigned</p>
                    </div>
                )}
            </div>

        <button className="mt-8 w-full py-4 bg-white/5 hover:bg-gold-500 text-white/50 hover:text-[#0F0A07] rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-white/10 hover:border-gold-500 font-work relative z-10 shadow-lg group">
            View Weekly <span className="group-hover:translate-x-1 inline-block transition-transform">Calendar</span>
        </button>
    </div>
);
};
