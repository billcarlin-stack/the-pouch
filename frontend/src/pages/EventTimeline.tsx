import { useEffect, useState } from 'react';
import { api, formatPlayerImage } from '../services/api';
import { Clock, Navigation } from 'lucide-react';

interface TimelineEvent {
    id: string;
    timestamp: string;
    player_id: number;
    player_name: string;
    action: string;
    quarter: string;
    time_remaining: string;
    coordinates?: string;
}

export const EventTimeline = () => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const res = await api.get<{ events: TimelineEvent[] }>('/timeline/events');
                setEvents(res.data.events);
            } catch (error) {
                console.error('Error fetching timeline events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTimeline();
    }, []);

    if (loading) {
        return <div className="p-20 text-center font-bold text-gold-400 uppercase tracking-widest">Loading Match Timeline...</div>;
    }

    return (
        <div className="p-8 max-w-[1000px] mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="h-[1px] w-10 bg-gold-400/40"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Ball-in-Play CTR Data Feed</span>
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                    Event <span className="text-gold-400">Timeline</span>
                </h1>
            </div>

            <div className="relative before:absolute before:inset-0 before:ml-12 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-gold-400/50 before:via-gold-400/20 before:to-transparent">
                {events.map((event, idx) => (
                    <div key={event.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mt-8 first:mt-0">
                        {/* Avatar Marker */}
                        <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#0F0A07] bg-[#1A1411] shadow-[0_0_20px_rgba(246,176,0,0.2)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 transition-transform duration-500 group-hover:scale-110 overflow-hidden">
                            <img 
                                src={formatPlayerImage(event.player_id, undefined, event.player_name)} 
                                alt={event.player_name}
                                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                            />
                        </div>

                        {/* Event Card */}
                        <div className="w-[calc(100%-7rem)] md:w-[calc(50%-4rem)] bg-[#1A1411] p-6 rounded-[2rem] shadow-2xl border border-white/5 group-hover:border-gold-400/30 transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_10px_30px_rgba(246,176,0,0.15)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start mb-4 gap-4 relative z-10">
                                <h3 className="font-black text-xl text-white tracking-tight font-space uppercase leading-none">{event.player_name}</h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-gold-400 bg-gold-500/10 px-4 py-2 rounded-full uppercase tracking-[0.2em] font-work border border-gold-400/20 w-fit">
                                    <Clock size={12} className="shrink-0" />
                                    {event.quarter} • {event.time_remaining}
                                </div>
                            </div>
                            <p className="text-white/70 font-medium font-work italic leading-relaxed relative z-10">{event.action}</p>
                            
                            {event.coordinates && (
                                <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 text-[9px] font-black text-gold-400/60 uppercase tracking-[0.3em] font-work relative z-10">
                                    <Navigation size={12} className="shrink-0" />
                                    COORD: {event.coordinates}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {events.length === 0 && !loading && (
                    <div className="bg-white/5 p-12 rounded-[3rem] text-center text-white/40 border border-white/5 font-work flex flex-col items-center gap-4">
                        <Clock size={32} className="opacity-20" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">No events found in the CTR data feed for this match.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventTimeline;
