/*
  The Nest — Squad Calendar
  Full page weekly view with event creation for coaches.
*/

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    Users,
    Trash2,
    X,
} from 'lucide-react';
import { clsx } from 'clsx';

const EVENT_TYPES = [
    { label: 'Main Session', color: 'bg-gold-500', bg: 'bg-gold-500/10', text: 'text-gold-400', border: 'border-gold-400/20' },
    { label: 'Weights', color: 'bg-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    { label: 'Media', color: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    { label: 'Rehab', color: 'bg-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    { label: 'Recovery', color: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    { label: 'Other', color: 'bg-white/20', bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/10' },
];

const CalendarPage = () => {
    const { user } = useAuth();
    const isCoach = user?.role === 'coach';

    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        type: 'Main Session',
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        player_ids: [] as number[],
    });

    useEffect(() => {
        const load = async () => {
            try {
                // Get start and end of week
                const start = new Date(currentDate);
                start.setDate(start.getDate() - start.getDay() + 1); // Monday
                start.setHours(0, 0, 0, 0);

                const end = new Date(start);
                end.setDate(end.getDate() + 6); // Sunday
                end.setHours(23, 59, 59, 999);

                const [eventsData, playersData] = await Promise.all([
                    ApiService.getCalendarEvents({
                        start_date: start.toISOString(),
                        end_date: end.toISOString(),
                        player_id: isCoach ? undefined : user?.jumper_no || undefined
                    }),
                    isCoach ? ApiService.getPlayers() : Promise.resolve([])
                ]);

                setEvents(eventsData);
                setPlayers(playersData);
            } catch (err) {
                console.error("Failed to load calendar", err);
            }
        };
        load();
    }, [currentDate, user, isCoach]);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - d.getDay() + 1 + i);
        return d;
    });

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const startStr = `${formData.date}T${formData.startTime}:00Z`;
            const endStr = `${formData.date}T${formData.endTime}:00Z`;

            await ApiService.createCalendarEvent({
                title: formData.title,
                type: formData.type,
                description: formData.description,
                start_time: startStr,
                end_time: endStr,
                player_ids: formData.player_ids
            });

            // Refresh
            const start = new Date(currentDate);
            start.setDate(start.getDate() - start.getDay() + 1);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);

            const refreshed = await ApiService.getCalendarEvents({
                start_date: start.toISOString(),
                end_date: end.toISOString(),
                player_id: isCoach ? undefined : user?.jumper_no || undefined
            });
            setEvents(refreshed);

            setShowModal(false);
            setFormData({
                title: '',
                type: 'Main Session',
                description: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '11:00',
                player_ids: []
            });
        } catch (err) {
            console.error("Failed to save event", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this event?")) return;
        try {
            await ApiService.deleteCalendarEvent(id);
            setEvents(events.filter(e => e.id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 max-w-[1400px] mx-auto p-8 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 border-b border-white/5 relative z-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-10 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Weekly Schedule</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                        Squad <span className="text-gold-400">Calendar</span>
                    </h1>
                    <p className="text-white/50 font-medium text-sm font-work italic">Weekly session schedule and tactical tasks.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl shadow-lg p-1.5 backdrop-blur-md">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-5 font-black text-white text-[11px] uppercase tracking-[0.2em] font-space text-center min-w-[140px]">
                            {weekDays[0].toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} <span className="text-white/30 mx-1">—</span> {weekDays[6].toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {isCoach && (
                        <button
                            onClick={() => {
                                setFormData({ ...formData, date: new Date().toISOString().split('T')[0] });
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-gold-500 text-[#0F0A07] px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] font-work shadow-[0_5px_15px_rgba(246,176,0,0.3)] hover:scale-105 hover:bg-white transition-all"
                        >
                            <Plus size={16} />
                            Add Event
                        </button>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-[#1A1411] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[600px] relative z-10">
                <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
                    {weekDays.map((date, i) => (
                        <div key={i} className={clsx(
                            "p-5 text-center border-r border-white/5 last:border-0",
                            date.toDateString() === new Date().toDateString() ? "bg-gold-500/10 shadow-[inset_0_-2px_0_rgba(246,176,0,1)]" : ""
                        )}>
                            <p className={clsx(
                                "text-[9px] font-black uppercase tracking-[0.3em] font-work mb-2",
                                date.toDateString() === new Date().toDateString() ? "text-gold-400" : "text-white/40"
                            )}>
                                {date.toLocaleDateString('en-AU', { weekday: 'short' })}
                            </p>
                            <p className={clsx(
                                "text-2xl font-black font-space leading-none",
                                date.toDateString() === new Date().toDateString() ? "text-gold-400 drop-shadow-[0_0_10px_rgba(246,176,0,0.5)]" : "text-white/80"
                            )}>
                                {date.getDate()}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 divide-x divide-white/5 min-h-[500px]">
                    {weekDays.map((date, dayIdx) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayEvents = events.filter(e => e.start_time.split('T')[0] === dateStr);

                        return (
                            <div key={dayIdx} className={clsx(
                                "p-3 space-y-3",
                                date.toDateString() === new Date().toDateString() ? "bg-gold-400/[0.02]" : ""
                            )}>
                                {dayEvents.map((event, eventIdx) => {
                                    const typeMap: Record<string, {bg: string, text: string, border: string, dot: string}> = {
                                        'Main Session': { bg: 'bg-gold-500/10', text: 'text-gold-400', border: 'border-gold-400/20', dot: 'bg-gold-400' },
                                        'Weights': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-400' },
                                        'Media': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400' },
                                        'Rehab': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-400' },
                                        'Recovery': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
                                        'Other': { bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/10', dot: 'bg-white/40' },
                                    };
                                    const tDate = typeMap[event.type] || typeMap['Other'];
                                    const startTime = new Date(event.start_time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });

                                    return (
                                        <div key={eventIdx} className={clsx(
                                            "group p-4 rounded-[1.25rem] border transition-all duration-300 relative",
                                            tDate.bg, tDate.border, "hover:bg-white/10"
                                        )}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className={clsx("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", tDate.dot)} />
                                                    <span className={clsx("text-[9px] font-black uppercase truncate tracking-[0.2em] font-work", tDate.text)}>
                                                        {event.type}
                                                    </span>
                                                </div>
                                                {isCoach && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                                                        className="text-white/20 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            <h4 className="text-sm font-black text-white mb-2 line-clamp-2 leading-tight uppercase font-space tracking-tight">
                                                {event.title}
                                            </h4>

                                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 font-work italic">
                                                <Clock size={10} className="text-white/30 shrink-0" />
                                                {startTime}
                                            </div>

                                            {event.player_ids.length > 0 ? (
                                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] font-black text-white/40 font-work uppercase tracking-widest">
                                                    <Users size={12} className="text-white/20 shrink-0" />
                                                    {event.player_ids.length} Player{event.player_ids.length > 1 ? 's' : ''}
                                                </div>
                                            ) : (
                                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] font-black text-gold-400 font-work uppercase tracking-widest">
                                                    <Users size={12} className="text-gold-400/50 shrink-0" />
                                                    Full Squad
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {dayEvents.length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-white/5 rounded-[1.5rem] flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity hover:border-gold-400/20">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-work text-white/30">Rest Day</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals & Helpers */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0A07]/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#1A1411] rounded-[2.5rem] border border-white/5 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                        <div className="p-8 pb-4 flex items-start justify-between text-white relative z-10">
                            <div>
                                <h3 className="text-3xl font-black uppercase font-space tracking-tight">Add Session <span className="text-gold-400">Event</span></h3>
                                <p className="text-white/40 text-[10px] font-black font-work uppercase tracking-[0.3em] mt-2">Assign tasks to squad members</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="bg-white/5 border border-white/10 p-2.5 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddEvent} className="p-8 space-y-8 relative z-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Event Title</label>
                                    <input
                                        type="text" required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-bold text-white placeholder:text-white/20 text-sm font-work"
                                        placeholder="e.g., Tactical Walkthrough"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-bold text-white appearance-none cursor-pointer text-sm font-work"
                                    >
                                        {EVENT_TYPES.map(t => <option key={t.label} value={t.label} className="bg-[#1A1411] text-white">{t.label}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Date</label>
                                    <input
                                        type="date" required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-bold text-white text-sm font-work [color-scheme:dark]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Starts</label>
                                    <input
                                        type="time" required
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-bold text-white text-sm font-work [color-scheme:dark]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Ends</label>
                                    <input
                                        type="time" required
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-bold text-white text-sm font-work [color-scheme:dark]"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Assign To (Empty = Whole Squad)</label>
                                    <div className="grid grid-cols-4 gap-3 h-40 overflow-y-auto p-5 bg-white/5 rounded-2xl border border-white/10 custom-scrollbar">
                                        {players.map(p => (
                                            <button
                                                key={p.jumper_no}
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.player_ids;
                                                    if (current.includes(p.jumper_no)) {
                                                        setFormData({ ...formData, player_ids: current.filter(id => id !== p.jumper_no) });
                                                    } else {
                                                        setFormData({ ...formData, player_ids: [...current, p.jumper_no] });
                                                    }
                                                }}
                                                className={clsx(
                                                    "p-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all truncate font-work",
                                                    formData.player_ids.includes(p.jumper_no)
                                                        ? "bg-gold-500/20 text-gold-400 border-gold-400/50 shadow-[0_0_15px_rgba(246,176,0,0.15)]"
                                                        : "bg-white/5 text-white/40 border-white/5 hover:border-gold-400/30 hover:text-white"
                                                )}
                                            >
                                                #{p.jumper_no} {p.name.split(' ').pop()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Description / Notes</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-medium text-white resize-none text-sm placeholder:text-white/20 font-work italic"
                                        placeholder="Add further tactical details here..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-5 rounded-full bg-gold-500 text-[#0F0A07] font-black text-[11px] uppercase tracking-[0.3em] font-work shadow-[0_5px_20px_rgba(246,176,0,0.3)] hover:bg-white hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSaving ? 'Deploying Event...' : 'Confirm Session Event'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
