/*
  The Nest — Post Match Player Review Dashboard
  
  Module 3: Visualizes granular coaching ratings.
  Modes: Player (Radar), Team (Matrix), and Yearly (Progression Matrix).
*/

import { useEffect, useState, useRef } from 'react';
import { ApiService, formatPlayerImage } from '../services/api';
import type { Player, CoachRating, AggregatedRating, TeamMatrixResponse, YearlyMatrixResponse } from '../services/api';
import { User, Activity, LayoutGrid, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { NativeRadarChart } from '../components/common/NativeRadarChart';

type ViewMode = 'PLAYER' | 'TEAM' | 'YEAR';

/** 
 * Compact Performance Cell 
 * 1-3: Red
 * 4-6: Black 
 * 7-10: Green
 */
const HeatmapCell = ({ value }: { value: number }) => {
    if (!value || value === 0) return <div className="w-8 h-8 flex items-center justify-center text-white/20 text-[10px] font-work">—</div>;
    
    // Adjusted for better contrast in dark mode
    const bgColor = 
        value <= 3 ? "bg-rose-500/20 text-rose-400 border border-rose-500/20" : 
        value <= 6 ? "bg-white/5 text-white/60 border border-white/10" : 
        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20";
    
    return (
        <div className={clsx(
            "w-8 h-8 flex items-center justify-center rounded-xl font-black text-[11px] shadow-sm transition-all hover:scale-110 hover:shadow-lg font-space",
            bgColor
        )}>
            {value}
        </div>
    );
};

export const RatingComparison = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('PLAYER');
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);
    const [selectedCategory, setSelectedCategory] = useState<string>("Technical");
    
    // Data states
    const [ratings, setRatings] = useState<CoachRating[]>([]);
    const [aggregatedRatings, setAggregatedRatings] = useState<AggregatedRating[]>([]);
    const [teamMatrix, setTeamMatrix] = useState<TeamMatrixResponse | null>(null);
    const [yearlyMatrix, setYearlyMatrix] = useState<YearlyMatrixResponse | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [radarSize, setRadarSize] = useState({ w: 500, h: 400 });
    const radarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ApiService.getPlayers().then(setPlayers).finally(() => setLoading(false));
    }, []);

    // Fetch Player View Data
    useEffect(() => {
        if (viewMode === 'PLAYER' && selectedPlayerId) {
            ApiService.getRatings(selectedPlayerId.toString()).then(res => {
                setRatings(res.ratings || []);
                setAggregatedRatings(res.aggregated || []);
            });
        }
    }, [selectedPlayerId, viewMode]);

    // Fetch Team Matrix Data
    useEffect(() => {
        if (viewMode === 'TEAM') {
            setLoading(true);
            ApiService.getTeamMatrix().then(setTeamMatrix).finally(() => setLoading(false));
        }
    }, [viewMode]);

    // Fetch Yearly Matrix Data
    useEffect(() => {
        if (viewMode === 'YEAR' && selectedPlayerId) {
            setLoading(true);
            ApiService.getYearlyMatrix(selectedPlayerId).then(setYearlyMatrix).finally(() => setLoading(false));
        }
    }, [selectedPlayerId, viewMode]);

    useEffect(() => {
        const obs = new ResizeObserver(() => {
            if (radarRef.current) {
                setRadarSize({ 
                    w: radarRef.current.offsetWidth, 
                    h: Math.max(400, radarRef.current.offsetHeight) 
                });
            }
        });
        if (radarRef.current) obs.observe(radarRef.current);
        return () => obs.disconnect();
    }, []);

    const filteredRatings = ratings.filter(r => r.category === selectedCategory);

    const chartData = aggregatedRatings.map(r => ({
        subject: r.category,
        Coach: r.coach,
        Self: r.self,
        Squad: r.squad,
    }));

    if (loading && players.length === 0) return <div className="p-20 text-center text-white/40 font-work italic">Initialising Tactical Suite...</div>;

    const selectedPlayer = players.find(p => p.jumper_no === selectedPlayerId);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {/* Mode Switcher & Header */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-[#1A1411] p-8 rounded-[2.5rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:bg-gold-400/10 transition-colors"></div>
                <div className="relative z-10 space-y-3">
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">Ratings <span className="text-gold-400">Comparison</span></h1>
                    <div className="flex gap-2 mt-4 bg-white/5 p-1.5 rounded-2xl w-fit border border-white/10 shrink-0">
                        {[
                            { id: 'PLAYER', label: 'By Player', icon: User },
                            { id: 'TEAM', label: 'By Team', icon: LayoutGrid },
                            { id: 'YEAR', label: 'By Year', icon: Calendar },
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setViewMode(m.id as ViewMode)}
                                className={clsx(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 font-work",
                                    viewMode === m.id
                                        ? "bg-gold-500/20 text-gold-400 shadow-[0_0_15px_rgba(246,176,0,0.15)] border border-gold-400/30"
                                        : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <m.icon size={14} />
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 relative z-10 w-full lg:w-auto">
                    {/* Only show Player Selector for PLAYER and YEAR modes */}
                    {(viewMode === 'PLAYER' || viewMode === 'YEAR') && (
                        <div className="w-full lg:w-72 relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-gold-400 transition-colors" size={18} />
                            <select
                                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl appearance-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none font-medium text-white text-sm transition-all shadow-lg font-work"
                                value={selectedPlayerId}
                                onChange={e => setSelectedPlayerId(Number(e.target.value))}
                            >
                                <option value={0} className="bg-[#1A1411] text-white">Select Player...</option>
                                {players.map(p => (
                                    <option key={p.jumper_no} value={p.jumper_no} className="bg-[#1A1411] text-white">#{p.jumper_no} {p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {viewMode === 'PLAYER' && selectedPlayerId !== 0 && (
                        <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full lg:w-auto overflow-x-auto custom-scrollbar shrink-0">
                            {["Technical", "Tactical", "Physical", "Mental"].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={clsx(
                                        "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap font-work shrink-0",
                                        selectedCategory === cat
                                            ? "bg-gold-400 text-[#0F0A07] shadow-[0_0_15px_rgba(246,176,0,0.3)]"
                                            : "text-white/40 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* View Mode Rendering */}
            <div className="flex-1">
                {viewMode === 'PLAYER' && (
                    selectedPlayerId === 0 ? (
                        <EmptyState message="Please select a player to begin analysis." />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Radar View */}
                             <div className="bg-[#1A1411] p-8 rounded-[3rem] text-white border border-white/5 shadow-2xl relative flex flex-col overflow-hidden min-h-[500px]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-full border-4 border-[#0F0A07] shadow-[0_0_15px_rgba(246,176,0,0.2)] p-0.5 bg-[#1A1411]">
                                            <img
                                                src={formatPlayerImage(selectedPlayerId, selectedPlayer?.photo_url)}
                                                className="w-full h-full object-cover rounded-full bg-[#0F0A07] grayscale-[20%]"
                                                alt={selectedPlayer?.name}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl uppercase tracking-tight font-space leading-tight">{selectedPlayer?.name}</h3>
                                            <p className="text-[10px] text-gold-400 font-black uppercase tracking-[0.3em] font-work mt-1">Alignment Radar</p>
                                        </div>
                                    </div>
                                </div>
                                <div ref={radarRef} className="flex-1 flex items-center justify-center min-h-[350px]">
                                    <NativeRadarChart data={chartData} size={radarSize} categories={['Coach', 'Self', 'Squad']} colors={{ Coach: { stroke: '#ffffff', fill: '#ffffff', opacity: 0.1 }, Self: { stroke: '#f6b000', fill: 'transparent', opacity: 0 }, Squad: { stroke: '#ffffff30', fill: 'transparent', opacity: 0, dash: '4 4' } }} />
                                </div>
                             </div>

                             {/* Gap Analysis Table */}
                             <div className="bg-[#1A1411] p-8 rounded-[3rem] shadow-2xl border border-white/5 flex flex-col overflow-hidden relative">
                                <h3 className="font-black text-2xl uppercase tracking-tight text-white mb-6 font-space border-b border-white/5 pb-6">Alignment Gaps</h3>
                                <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                    <table className="w-full">
                                        <thead className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] font-work border-b border-white/5 sticky top-0 bg-[#1A1411] z-10 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.5)]">
                                            <tr>
                                                <th className="pb-5 text-left bg-[#1A1411]">Skill</th>
                                                <th className="pb-5 text-center bg-[#1A1411]">Staff</th>
                                                <th className="pb-5 text-center bg-[#1A1411]">Self</th>
                                                <th className="pb-5 text-right bg-[#1A1411]">Gap</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {filteredRatings.map((r, i) => (
                                                <tr key={i} className="group transition-colors hover:bg-white/[0.02]">
                                                    <td className="py-5">
                                                        <div className="font-bold text-white/90 font-work text-sm">{r.skill}</div>
                                                    </td>
                                                    <td className="py-5 text-center font-black font-space text-lg text-white">{r.coach_rating}</td>
                                                    <td className="py-5 text-center font-black font-space text-lg text-white/50 group-hover:text-gold-400 transition-colors">{r.self_rating}</td>
                                                    <td className="py-5 text-right">
                                                        <span className={clsx("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest font-space border", (r.gap || 0) > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : (r.gap || 0) < 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(243,24,96,0.1)]" : "bg-white/5 text-white/40 border-white/10")}>
                                                            {(r.gap || 0) > 0 ? `+${r.gap}` : r.gap}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                        </div>
                    )
                )}

                {viewMode === 'TEAM' && teamMatrix && (
                    <div className="bg-[#1A1411] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col h-[calc(100vh-320px)] animate-in zoom-in-95 duration-500 relative">
                        <div className="bg-white/5 border-b border-white/5 px-8 py-6 text-white flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
                            <div>
                                <h2 className="font-black text-2xl uppercase leading-none font-space tracking-tight">Team Performance <span className="text-gold-400">Heatmap</span></h2>
                                <p className="text-white/40 text-[10px] font-black font-work uppercase tracking-[0.3em] mt-2">Squad Aggregate Assessment</p>
                            </div>
                            <div className="flex items-center gap-5 bg-[#0F0A07] border border-white/5 px-5 py-3 rounded-2xl shadow-lg">
                                {[
                                    { label: 'Under', color: 'bg-rose-500/20 border-rose-500/50' },
                                    { label: 'Neutral', color: 'bg-white/5 border-white/20' },
                                    { label: 'Elite', color: 'bg-emerald-500/20 border-emerald-500/50' },
                                ].map(legend => (
                                    <div key={legend.label} className="flex items-center gap-2">
                                        <div className={clsx("w-3 h-3 rounded-md border", legend.color)} />
                                        <span className="text-[10px] font-black uppercase text-white/50 font-work tracking-[0.1em]">{legend.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="overflow-auto flex-1 custom-scrollbar relative bg-[#0F0A07]/50">
                            <table className="w-full text-left border-separate border-spacing-0 min-w-max">
                                <thead className="sticky top-0 z-30 bg-[#1A1411] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] border-b border-white/5">
                                    <tr>
                                        <th className="sticky left-0 z-40 bg-[#1A1411] p-4 min-w-[220px] border-b border-r border-white/5">
                                            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-work pl-4">Athlete</div>
                                        </th>
                                        {teamMatrix.skills.map(skill => (
                                            <th key={skill} className="p-2 border-b border-white/5 text-center min-w-[50px] bg-[#1A1411]">
                                                <div className="text-[10px] font-black text-white/70 font-work uppercase tracking-tighter leading-none whitespace-nowrap [writing-mode:vertical-lr] rotate-180 h-32 mx-auto py-4 group hover:text-gold-400 transition-colors cursor-default">
                                                    {skill}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamMatrix.players.map((p, idx) => (
                                        <tr key={p.id} className={clsx("group transition-colors hover:bg-white/[0.02]", idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]")}>
                                            <td className="sticky left-0 z-20 bg-inherit p-4 border-b border-r border-white/5 font-black text-white flex items-center gap-4 group-hover:bg-[#1A1411] transition-colors">
                                                <span className="text-[10px] text-white/20 font-space w-6 text-right shrink-0">#{p.id}</span>
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0F0A07] border border-white/10 shrink-0 shadow-lg">
                                                    <img src={formatPlayerImage(p.id)} className="w-full h-full object-cover grayscale-[20%]" alt="" />
                                                </div>
                                                <span className="text-[13px] truncate tracking-tight font-space uppercase text-white/90">{p.name}</span>
                                            </td>
                                            {teamMatrix.skills.map(skill => (
                                                <td key={skill} className="p-2 border-b border-white/[0.02] text-center">
                                                    <div className="flex justify-center">
                                                        <HeatmapCell value={teamMatrix.matrix[p.id]?.[skill]?.coach || 0} />
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {viewMode === 'YEAR' && (
                    selectedPlayerId === 0 ? (
                        <EmptyState message="Select an athlete to view their longitudinal performance heatmap." />
                    ) : yearlyMatrix ? (
                        <div className="bg-[#1A1411] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col h-[calc(100vh-320px)] animate-in zoom-in-95 duration-500 relative">
                            <div className="bg-white/5 border-b border-white/5 px-8 py-6 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold-400 bg-[#0F0A07] shadow-lg shrink-0">
                                        <img src={formatPlayerImage(selectedPlayerId)} className="w-full h-full object-cover grayscale-[10%]" alt="" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-2xl uppercase leading-none font-space tracking-tight">{selectedPlayer?.name} <span className="text-gold-400">Progression</span></h2>
                                        <p className="text-white/40 text-[10px] font-black font-work uppercase tracking-[0.3em] mt-2">Match-by-Match Visual Audit</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-auto flex-1 custom-scrollbar relative bg-[#0F0A07]/50">
                                <table className="w-full text-left border-separate border-spacing-0 min-w-max">
                                    <thead className="sticky top-0 z-30 bg-[#1A1411] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] border-b border-white/5">
                                        <tr>
                                            <th className="sticky left-0 z-40 bg-[#1A1411] p-4 min-w-[160px] border-b border-r border-white/5">
                                                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-work pl-4">Round</div>
                                            </th>
                                            {yearlyMatrix.skills.map(skill => (
                                                <th key={skill} className="p-2 border-b border-white/5 text-center min-w-[50px] bg-[#1A1411]">
                                                    <div className="text-[10px] font-black text-white/70 font-work uppercase tracking-tighter leading-none whitespace-nowrap [writing-mode:vertical-lr] rotate-180 h-32 mx-auto py-4 group hover:text-gold-400 transition-colors cursor-default">
                                                        {skill}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {yearlyMatrix.rounds.map((round, idx) => (
                                            <tr key={round} className={clsx("group transition-colors hover:bg-white/[0.02]", idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]")}>
                                                <td className="sticky left-0 z-20 bg-inherit p-4 px-8 border-b border-r border-white/5 font-black text-gold-400 text-sm font-space group-hover:bg-[#1A1411] transition-colors whitespace-nowrap">
                                                    {round}
                                                </td>
                                                {yearlyMatrix.skills.map(skill => (
                                                    <td key={skill} className="p-2 border-b border-white/[0.02] text-center">
                                                        <div className="flex justify-center">
                                                            <HeatmapCell value={yearlyMatrix.matrix[round]?.[skill]?.coach || 0} />
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : <EmptyState message="Loading longitudinal progression matrix..." />
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-32 bg-[#1A1411] rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:bg-gold-400/10 transition-colors"></div>
        <div className="p-8 bg-white/5 border border-white/10 rounded-full mb-8 shadow-inner shadow-black/20 text-white/10 group-hover:text-gold-400/50 group-hover:border-gold-400/20 group-hover:bg-gold-500/5 transition-all">
            <Activity size={56} className="relative z-10" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3 font-space uppercase tracking-tight relative z-10 text-center">Awaiting <span className="text-gold-400">Parameters</span></h2>
        <p className="text-white/40 font-work italic text-sm text-center relative z-10 max-w-sm">{message}</p>
    </div>
);
