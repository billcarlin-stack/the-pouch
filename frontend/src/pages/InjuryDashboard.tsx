/*
  The Nest — Injury & Load Log Dashboard
  
  Module 1: Tracks player injuries and updates their status.
*/

import { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import type { Injury, Player } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    Plus,
    Save
} from 'lucide-react';
import { clsx } from 'clsx';

export const InjuryDashboard = () => {
    const { user } = useAuth();
    const [injuries, setInjuries] = useState<Injury[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState<Partial<Injury>>({
        player_id: user?.role === 'player' ? (user.jumper_no || 0) : 0,
        injury_type: '',
        body_area: '',
        severity: 'Minor',
        status: 'Active',
        notes: ''
    });

    // Ensure player_id is set if user role is player
    useEffect(() => {
        if (user?.role === 'player' && user.jumper_no) {
            setFormData(prev => ({ ...prev, player_id: user.jumper_no || 0 }));
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [injData, playersData] = await Promise.all([
                ApiService.getInjuries(),
                ApiService.getPlayers()
            ]);
            setInjuries(injData);
            setPlayers(playersData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.player_id) return alert("Please select a player");

        try {
            await ApiService.logInjury(formData);
            alert("Injury logged and player status updated!");
            setFormData({ ...formData, injury_type: '', body_area: '', notes: '' }); // Reset some fields
            fetchData(); // Refresh list
        } catch (err) {
            alert("Failed to save injury log");
        }
    };

    // KPIs
    const activeCount = injuries.filter(i => i.status === 'Active').length;
    const recoveringCount = injuries.filter(i => i.status === 'Recovering').length;
    const clearedCount = injuries.filter(i => i.status === 'Cleared').length;
    const totalCount = injuries.length;

    if (loading) return <div className="p-10 text-center text-white/80">Loading module...</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative max-w-[1200px] mx-auto p-8">
            <div className="space-y-4 border-b border-white/5 pb-8 mb-8">
                <div className="flex items-center gap-3">
                    <span className="h-[1px] w-10 bg-rose-500/40"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400 font-work">Medical & Operations</span>
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                    Injury & <span className="text-rose-500">Load Log</span>
                </h1>
                <p className="text-white/50 text-sm font-medium mt-1 font-work italic">Manage injury records and update player availability status.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#1A1411] p-6 rounded-[2rem] shadow-2xl border border-white/5 flex items-center gap-5 relative overflow-hidden group hover:border-rose-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl relative z-10 border border-rose-500/20"><AlertCircle size={28} /></div>
                    <div className="relative z-10">
                        <div className="text-3xl font-black text-white font-space tracking-tight">{activeCount}</div>
                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1 font-work">Active Injuries</div>
                    </div>
                </div>
                <div className="bg-[#1A1411] p-6 rounded-[2rem] shadow-2xl border border-white/5 flex items-center gap-5 relative overflow-hidden group hover:border-gold-400/30 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold-400/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-gold-400/10 transition-colors"></div>
                    <div className="p-4 bg-gold-500/10 text-gold-400 rounded-2xl relative z-10 border border-gold-400/20"><Clock size={28} /></div>
                    <div className="relative z-10">
                        <div className="text-3xl font-black text-white font-space tracking-tight">{recoveringCount}</div>
                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1 font-work">Recovering</div>
                    </div>
                </div>
                <div className="bg-[#1A1411] p-6 rounded-[2rem] shadow-2xl border border-white/5 flex items-center gap-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl relative z-10 border border-emerald-500/20"><CheckCircle size={28} /></div>
                    <div className="relative z-10">
                        <div className="text-3xl font-black text-white font-space tracking-tight">{clearedCount}</div>
                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1 font-work">Cleared</div>
                    </div>
                </div>
                <div className="bg-[#1A1411] p-6 rounded-[2rem] shadow-2xl border border-white/5 flex items-center gap-5 relative overflow-hidden group hover:border-white/20 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/10 transition-colors"></div>
                    <div className="p-4 bg-white/5 text-white/60 rounded-2xl relative z-10 border border-white/10"><Activity size={28} /></div>
                    <div className="relative z-10">
                        <div className="text-3xl font-black text-white font-space tracking-tight">{totalCount}</div>
                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1 font-work">Total Records</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Log Table */}
                <div className="lg:col-span-2 bg-[#1A1411] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col relative group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none"></div>
                    <div className="p-8 border-b border-white/5 relative z-10">
                        <h3 className="font-black text-2xl text-white uppercase font-space tracking-tight">Recent Logs</h3>
                    </div>
                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-white/30 font-black font-work uppercase tracking-[0.2em] text-[10px]">
                                <tr>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Player</th>
                                    <th className="px-8 py-5">Injury</th>
                                    <th className="px-8 py-5">Severity</th>
                                    <th className="px-8 py-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {injuries.map(log => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6 text-white/40 font-work italic text-xs">{log.date}</td>
                                        <td className="px-8 py-6 font-black text-white text-base font-space uppercase tracking-tight">{log.player_name}</td>
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-white/80 font-work text-sm">{log.injury_type}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={clsx(
                                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                log.severity === 'Major' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                    log.severity === 'Moderate' ? 'bg-gold-500/10 text-gold-400 border-gold-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            )}>
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx(
                                                    "w-2 h-2 rounded-full shadow-lg",
                                                    log.status === 'Active' ? 'bg-rose-500 shadow-rose-500/30' :
                                                        log.status === 'Recovering' ? 'bg-gold-500 shadow-gold-500/30' :
                                                            'bg-emerald-500 shadow-emerald-500/30'
                                                )}></div>
                                                <span className="font-bold font-work text-xs text-white/80">{log.status}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {injuries.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center text-white/20 font-work uppercase tracking-widest text-[10px] italic">No injury records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Entry Form */}
                <div className="bg-[#1A1411] p-8 rounded-[2.5rem] shadow-2xl border border-white/5 h-fit relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                    <h3 className="font-black text-2xl text-white mb-8 flex items-center gap-3 font-space uppercase tracking-tight relative z-10">
                        <div className="p-2 border border-rose-500/20 bg-rose-500/10 text-rose-500 rounded-xl shadow-lg">
                            <Plus size={20} />
                        </div>
                        Log New Entry
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-work mb-2">Player</label>
                            <select
                                className={clsx(
                                    "w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 focus:outline-none text-white font-medium text-sm transition-all appearance-none",
                                    user?.role === 'player' && "opacity-50 cursor-not-allowed"
                                )}
                                value={formData.player_id}
                                onChange={e => setFormData({ ...formData, player_id: Number(e.target.value) })}
                                required
                                disabled={user?.role === 'player'}
                            >
                                <option value={0} className="bg-[#1A1411] text-white">Select Player...</option>
                                {players.map(p => (
                                    <option key={p.jumper_no} value={p.jumper_no} className="bg-[#1A1411] text-white">#{p.jumper_no} {p.name}</option>
                                ))}
                            </select>
                            {user?.role === 'player' && (
                                <p className="text-[10px] text-white/30 mt-2 font-work italic">Players can only log entries for their own records.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-work mb-2">Injury Type</label>
                            <input
                                type="text"
                                placeholder="e.g. Hamstring"
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 focus:outline-none text-white text-sm transition-all placeholder:text-white/20 font-medium"
                                value={formData.injury_type}
                                onChange={e => setFormData({ ...formData, injury_type: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-work mb-2">Body Area</label>
                            <select
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 focus:outline-none text-white font-medium text-sm transition-all appearance-none"
                                value={formData.body_area}
                                onChange={e => setFormData({ ...formData, body_area: e.target.value })}
                                required
                            >
                                <option value="" className="bg-[#1A1411] text-white">Select Area...</option>
                                <option value="Head/Neck" className="bg-[#1A1411] text-white">Head/Neck</option>
                                <option value="Shoulder" className="bg-[#1A1411] text-white">Shoulder</option>
                                <option value="Upper Arm" className="bg-[#1A1411] text-white">Upper Arm</option>
                                <option value="Elbow" className="bg-[#1A1411] text-white">Elbow</option>
                                <option value="Forearm" className="bg-[#1A1411] text-white">Forearm</option>
                                <option value="Hand/Wrist" className="bg-[#1A1411] text-white">Hand/Wrist</option>
                                <option value="Back/Spine" className="bg-[#1A1411] text-white">Back/Spine</option>
                                <option value="Chest/Abdo" className="bg-[#1A1411] text-white">Chest/Abdo</option>
                                <option value="Hip/Groin" className="bg-[#1A1411] text-white">Hip/Groin</option>
                                <option value="Thigh" className="bg-[#1A1411] text-white">Thigh</option>
                                <option value="Knee" className="bg-[#1A1411] text-white">Knee</option>
                                <option value="Lower Leg" className="bg-[#1A1411] text-white">Lower Leg</option>
                                <option value="Ankle" className="bg-[#1A1411] text-white">Ankle</option>
                                <option value="Foot/Toes" className="bg-[#1A1411] text-white">Foot/Toes</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-work mb-2">Severity</label>
                            <select
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 focus:outline-none text-white font-medium text-sm transition-all appearance-none"
                                value={formData.severity}
                                onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
                            >
                                <option value="Minor" className="bg-[#1A1411] text-white">Minor</option>
                                <option value="Moderate" className="bg-[#1A1411] text-white">Moderate</option>
                                <option value="Major" className="bg-[#1A1411] text-white">Major</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-work mb-2">Current Status</label>
                            <select
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 focus:outline-none text-white font-medium text-sm transition-all appearance-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="Active" className="bg-[#1A1411] text-white">Active Injury (Unavailable)</option>
                                <option value="Recovering" className="bg-[#1A1411] text-white">Recovering (Modified)</option>
                                <option value="Cleared" className="bg-[#1A1411] text-white">Cleared (Full Training)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-work mb-2">Notes</label>
                            <textarea
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 focus:outline-none text-white text-sm transition-all h-28 resize-none font-medium placeholder:text-white/20 italic"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add any relevant medical notes..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gold-500 text-[#0F0A07] py-5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-3 shadow-[0_5px_20px_rgba(246,176,0,0.3)] font-work mt-4"
                        >
                            <Save size={16} />
                            Log Entry & Update Status
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
