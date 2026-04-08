import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { Target, Plus, CheckCircle2, Star } from 'lucide-react';
import clsx from 'clsx';

interface WoopGoal {
    id: string;
    player_id: number;
    wish: string;
    outcome: string;
    obstacle: string;
    plan: string;
    status: string;
    week_of: string;
    created_at: string;
}

const WoopGoals = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<WoopGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ wish: '', outcome: '', obstacle: '', plan: '' });

    const playerId = user?.jumper_no;

    useEffect(() => {
        if (playerId) {
            ApiService.getWoopGoals(playerId).then(setGoals).catch(console.error).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [playerId]);

    const handleCreate = async () => {
        if (!playerId || !form.wish.trim()) return;
        setSaving(true);
        try {
            await ApiService.createWoopGoal({ ...form, player_id: playerId });
            const updated = await ApiService.getWoopGoals(playerId);
            setGoals(updated);
            setForm({ wish: '', outcome: '', obstacle: '', plan: '' });
            setShowForm(false);
        } catch (err) {
            console.error('Failed to create goal:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (goalId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
        try {
            await ApiService.updateWoopGoal(goalId, newStatus);
            setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
        } catch (err) {
            console.error('Failed to update goal:', err);
        }
    };

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    if (loading) return (
        <div className="p-8 space-y-4">
            <div className="h-20 bg-white/5 animate-pulse rounded-3xl" />
            <div className="h-40 bg-white/5 animate-pulse rounded-3xl" />
        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-10 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Framework</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                        WOOP <span className="text-gold-400">Strategy</span>
                    </h1>
                    <p className="text-white/40 font-medium font-work italic">
                        "Wish · Outcome · Obstacle · Plan — The psychological science of goal attainment."
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-3 bg-gold-500 text-[#0F0A07] px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] font-work hover:bg-white hover:scale-105 transition-all shadow-[0_10px_30px_-5px_rgba(246,176,0,0.4)]"
                >
                    <Plus size={16} />
                    Define New Strategy
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="premium-card p-10 space-y-8 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <h3 className="font-black text-xs text-white flex items-center gap-3 uppercase tracking-[0.2em] font-space">
                        <div className="p-2 bg-white/5 rounded-xl text-gold-400">
                            <Target size={18} />
                        </div>
                        Strategic Initiation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(['wish', 'outcome', 'obstacle', 'plan'] as const).map((field) => (
                            <div key={field} className="space-y-4">
                                <label className="stat-label !text-[8px] text-gold-400/60 uppercase tracking-[0.3em] block">
                                    {field === 'wish' && '1. The Wish — What do you want to achieve?'}
                                    {field === 'outcome' && '2. The Outcome — The best possible result?'}
                                    {field === 'obstacle' && '3. The Obstacle — What stands in your way?'}
                                    {field === 'plan' && '4. The Plan — If [obstacle], then I will...'}
                                </label>
                                <textarea
                                    value={form[field]}
                                    onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 resize-none transition-all placeholder:text-white/10 font-work"
                                    placeholder={`Define your ${field}...`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-white/5">
                        <button
                            onClick={handleCreate}
                            disabled={saving || !form.wish.trim()}
                            className="bg-gold-500 text-[#0F0A07] px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] font-work hover:bg-white transition-all disabled:opacity-20 shadow-xl"
                        >
                            {saving ? 'Processing...' : 'Commit Strategy'}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] font-work text-white/40 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Active Goals */}
            <div className="space-y-4">
                <h3 className="stat-label !text-[9px] text-gold-400/40 uppercase tracking-[0.4em] mb-6">
                    Operational Objectives ({activeGoals.length})
                </h3>
                {activeGoals.length === 0 && (
                    <div className="text-center py-24 premium-card border-dashed">
                        <Star size={40} className="mx-auto mb-6 text-white/5" />
                        <p className="text-white/20 font-work uppercase tracking-widest text-xs italic">Awaiting strategic initiation...</p>
                    </div>
                )}
                {activeGoals.map(goal => (
                    <div key={goal.id} className="premium-card p-10 group hover:shadow-gold-glow transition-all duration-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="flex items-start justify-between relative z-10 mb-10">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl group-hover:bg-gold-500/10 transition-colors duration-500">
                                    <Target size={24} className="text-gold-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-white text-3xl uppercase tracking-tight font-space group-hover:text-gold-400 transition-colors">{goal.wish}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-gold-400/40"></div>
                                        <p className="stat-label !text-[8px] opacity-40 uppercase tracking-widest">{goal.week_of}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle(goal.id, goal.status)}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] font-work text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-[#0F0A07] transition-all bg-emerald-500/5"
                            >
                                <CheckCircle2 size={14} />
                                Deploy
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            {[
                                { label: 'Outcome', value: goal.outcome, color: 'text-gold-400', bg: 'bg-gold-400/[0.03]' },
                                { label: 'Obstacle', value: goal.obstacle, color: 'text-rose-400', bg: 'bg-rose-400/[0.03]' },
                                { label: 'Plan', value: goal.plan, color: 'text-emerald-400', bg: 'bg-emerald-400/[0.03]' },
                            ].map((item) => (
                                <div key={item.label} className={clsx("rounded-[2rem] p-6 border border-white/5 space-y-4", item.bg)}>
                                    <div className="flex items-center gap-2">
                                        <div className={clsx("h-1 w-1 rounded-full shadow-lg", item.color.replace('text', 'bg'))}></div>
                                        <p className={clsx("stat-label !text-[7px] uppercase tracking-widest opacity-100", item.color)}>{item.label}</p>
                                    </div>
                                    <p className="text-white/70 font-work text-xs leading-relaxed italic">"{item.value || '—'}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div className="space-y-6">
                    <h3 className="stat-label !text-[9px] text-white/20 uppercase tracking-[0.4em] mb-2">
                        Strategically Archived ({completedGoals.length})
                    </h3>
                    <div className="grid gap-3">
                        {completedGoals.map(goal => (
                            <div key={goal.id} className="premium-card p-5 opacity-40 hover:opacity-100 transition-opacity duration-500 group border-none bg-white/[0.02]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-white/50 text-sm uppercase tracking-tight font-space line-through group-hover:text-white transition-colors">{goal.wish}</span>
                                            <div className="h-1 w-1 rounded-full bg-white/10"></div>
                                            <span className="stat-label !text-[7px] text-white/20 uppercase tracking-widest">{goal.week_of}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(goal.id, goal.status)}
                                        className="text-[8px] font-black text-white/20 hover:text-gold-400 uppercase tracking-[0.2em] font-work transition-colors"
                                    >
                                        Reactivate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WoopGoals;
