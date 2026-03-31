/*
  The Nest — Post Match Player Review Dashboard
  
  Module 3: Visualizes the gap between Coach, Self, and Squad ratings.
  Accessible only by Coaches/Staff.
*/

import { useEffect, useState, useRef } from 'react';
import { ApiService, formatPlayerImage } from '../services/api';
import type { Player, CoachRating, AggregatedRating } from '../services/api';
import { User, Activity, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { NativeRadarChart } from '../components/common/NativeRadarChart';

export const RatingComparison = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);
    const [selectedCategory, setSelectedCategory] = useState<string>("Technical");
    const [ratings, setRatings] = useState<CoachRating[]>([]);
    const [aggregatedRatings, setAggregatedRatings] = useState<AggregatedRating[]>([]);
    const [loading, setLoading] = useState(true);
    const [radarSize, setRadarSize] = useState({ w: 500, h: 400 });
    const radarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ApiService.getPlayers().then(setPlayers).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedPlayerId) {
            ApiService.getRatings(selectedPlayerId.toString()).then(res => {
                setRatings(res.ratings || []);
                setAggregatedRatings(res.aggregated || []);
            });
        } else {
            setRatings([]);
            setAggregatedRatings([]);
        }
    }, [selectedPlayerId]);

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

    if (loading) return <div className="p-20 text-center text-gray-400">Loading Dashboard...</div>;

    const selectedPlayer = players.find(p => p.jumper_no === selectedPlayerId);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {/* Premium Header */}
            <div className="flex items-center justify-between bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-hfc-brown/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-hfc-brown tracking-tight uppercase">Post Match Player Review</h1>
                    <p className="text-gray-500 font-medium mt-1">Comparative analysis of coaching staff vs player self-assessments.</p>
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                    {/* Player Selector */}
                    <div className="w-64 relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-hfc-brown transition-colors" size={18} />
                        <select
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl appearance-none focus:ring-4 focus:ring-hfc-brown/10 focus:border-hfc-brown focus:bg-white outline-none font-bold text-sm transition-all"
                            value={selectedPlayerId}
                            onChange={e => setSelectedPlayerId(Number(e.target.value))}
                        >
                            <option value={0}>Select Player...</option>
                            {players.map(p => (
                                <option key={p.jumper_no} value={p.jumper_no}>#{p.jumper_no} {p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl">
                        {["Technical", "Tactical", "Physical", "Mental"].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedCategory === cat
                                        ? "bg-hfc-brown text-white shadow-lg"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-white"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {selectedPlayerId === 0 ? (
                <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-sm">
                    <div className="p-6 bg-gray-50 rounded-full mb-6">
                        <Activity size={48} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Awaiting Selection</h2>
                    <p className="text-gray-400 font-medium">Please select a player from the dropdown to begin analysis.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">

                    {/* Left Column: Visual Analysis */}
                    <div className="bg-hfc-brown p-8 rounded-[3rem] text-white border border-white/10 shadow-2xl relative flex flex-col overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border-2 border-gold-400 p-0.5 bg-hfc-brown self-center">
                                    <img
                                        src={formatPlayerImage(selectedPlayerId, selectedPlayer?.photo_url)}
                                        className="w-full h-full object-cover rounded-full bg-gray-800"
                                        alt={selectedPlayer?.name}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter">{selectedPlayer?.name}</h3>
                                    <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest">Skill Alignment Radar</p>
                                </div>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gold-400">
                                Real-time Comparison
                            </div>
                        </div>

                        <div ref={radarRef} className="flex-1 flex items-center justify-center min-h-[400px]">
                            <NativeRadarChart 
                                data={chartData} 
                                size={radarSize} 
                                categories={['Coach', 'Self', 'Squad']}
                                colors={{
                                    Coach: { stroke: '#fff', fill: '#fff', opacity: 0.2 },
                                    Self: { stroke: '#fbbf24', fill: 'transparent', opacity: 0 },
                                    Squad: { stroke: '#ffffff30', fill: 'transparent', opacity: 0, dash: '4 4' }
                                }}
                            />
                        </div>

                        <div className="mt-8 flex justify-center gap-6">
                            {[
                                { label: 'Coach', color: 'bg-white' },
                                { label: 'Self', color: 'bg-gold-400' },
                                { label: 'Squad Avg', color: 'bg-gray-500', dash: true },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <div className={clsx("w-3 h-0.5", item.color, item.dash && "border-t-2 border-dashed bg-transparent border-gray-500 h-0")} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Gap Analysis Table */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-xl uppercase tracking-tight text-gray-900">Alignment Insights</h3>
                            <div className="flex items-center gap-2 text-hfc-brown bg-hfc-brown/5 px-3 py-1.5 rounded-xl text-xs font-bold">
                                <AlertCircle size={14} />
                                {filteredRatings.filter(r => Math.abs(r.gap || 0) >= 2).length} Critical Gaps
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                            <table className="w-full">
                                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 sticky top-0 bg-white z-10">
                                    <tr>
                                        <th className="pb-4 text-left">Skill Metrics</th>
                                        <th className="pb-4 text-center">Staff</th>
                                        <th className="pb-4 text-center">Player</th>
                                        <th className="pb-4 text-right">Differential</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRatings.map((r, i) => (
                                        <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-5">
                                                <div className="font-bold text-gray-900 group-hover:text-hfc-brown transition-colors">{r.skill}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{r.category}</div>
                                            </td>
                                            <td className="py-5 text-center">
                                                <div className="text-lg font-black text-gray-900">{r.coach_rating || '-'}</div>
                                            </td>
                                            <td className="py-5 text-center">
                                                <div className="text-lg font-black text-gold-500">{r.self_rating || '-'}</div>
                                            </td>
                                            <td className="py-5 text-right">
                                                <span className={clsx(
                                                    "inline-flex items-center justify-center w-12 py-1.5 rounded-xl font-black text-xs",
                                                    (r.gap || 0) > 0 ? "bg-emerald-100 text-emerald-700" :
                                                        (r.gap || 0) < 0 ? "bg-rose-100 text-rose-700" :
                                                            "bg-gray-100 text-gray-400"
                                                )}>
                                                    {(r.gap || 0) > 0 ? `+${r.gap}` : r.gap}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {ratings.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <p className="text-gray-400 font-medium italic">No recent rating alignment data for this player.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
