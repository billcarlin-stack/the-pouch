import { useState, useEffect, useMemo } from 'react';
import type { PlayerStats } from '../services/api';
import { ApiService } from '../services/api';
import {
    ChevronUp,
    ChevronDown,
    Search
} from 'lucide-react';
import clsx from 'clsx';

type SortConfig = {
    key: keyof PlayerStats;
    direction: 'asc' | 'desc';
};

const StatsPage = () => {
    const [stats, setStats] = useState<PlayerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'disposals_avg', direction: 'desc' });
    const [viewMode, setViewMode] = useState<'Average' | 'Total'>('Average');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await ApiService.getStats2025();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleSort = (key: keyof PlayerStats) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStats = useMemo(() => {
        let sortableItems = [...stats];
        if (searchTerm) {
            sortableItems = sortableItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        sortableItems.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
        return sortableItems;
    }, [stats, sortConfig, searchTerm]);

    const TableHeader = ({ label, sortKey, shortLabel }: { label: string; sortKey: keyof PlayerStats; shortLabel?: string }) => (
        <th
            onClick={() => handleSort(sortKey)}
            className={clsx(
                "px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] cursor-pointer hover:bg-white/10 transition-all group relative font-space",
                sortConfig.key === sortKey ? "text-gold-400 bg-white/5" : "text-white/20"
            )}
        >
            <div className="flex items-center gap-2 justify-center">
                <span className="hidden xl:inline">{label}</span>
                <span className="xl:hidden">{shortLabel || label}</span>
                <div className="flex flex-col opacity-20 group-hover:opacity-100 transition-opacity">
                    <ChevronUp size={8} className={clsx(sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'text-gold-400 opacity-100' : 'opacity-40')} />
                    <ChevronDown size={8} className={clsx(sortConfig.key === sortKey && sortConfig.direction === 'desc' ? 'text-gold-400 opacity-100' : 'opacity-40')} />
                </div>
            </div>
            {sortConfig.key === sortKey && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-400 shadow-[0_0_10px_rgba(246,176,0,0.5)]" />
            )}
        </th>
    );

    if (loading) return (
        <div className="p-8 space-y-4">
            <div className="h-20 w-full bg-white/5 animate-pulse rounded-3xl" />
            <div className="h-[600px] w-full bg-white/5 animate-pulse rounded-3xl" />
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/5 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-10 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Performance</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                        Squad <span className="text-gold-400">Metrics</span>
                    </h1>
                    <p className="text-white/40 font-medium font-work italic">
                        "High-velocity data processing for elite performance analysis."
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    {/* View Toggle */}
                    <div className="bg-[#1A1411] p-1.5 rounded-full border border-white/10 flex shadow-2xl">
                        {['Total', 'Average'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode as any)}
                                className={clsx(
                                    "px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 font-work",
                                    viewMode === mode
                                        ? "bg-gold-500 text-[#0F0A07] shadow-[0_5px_20px_-5px_rgba(246,176,0,0.4)]"
                                        : "text-white/20 hover:text-white"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gold-400/10 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH SQUAD..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-8 text-[11px] font-black text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 transition-all w-80 uppercase tracking-[0.2em] font-work relative z-10"
                        />
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-[#0F0A07] relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/[0.02] rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="overflow-x-auto custom-scrollbar relative z-10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.4em] font-space">#</th>
                                <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.4em] font-space min-w-[280px]">Entity</th>
                                <TableHeader label="AF SCORE" sortKey="af_avg" shortLabel="AF" />
                                <TableHeader label="RATING" sortKey="rating_points" shortLabel="R" />
                                <TableHeader label="GOALS" sortKey="goals_avg" shortLabel="G" />
                                <TableHeader label="DISPOSALS" sortKey="disposals_avg" shortLabel="D" />
                                <TableHeader label="MARKS" sortKey="marks_avg" shortLabel="M" />
                                <TableHeader label="TACKLES" sortKey="tackles_avg" shortLabel="T" />
                                <TableHeader label="CLEARANCES" sortKey="clearances_avg" shortLabel="CLR" />
                                <TableHeader label="KICKS" sortKey="kicks_avg" shortLabel="K" />
                                <TableHeader label="HANDBALLS" sortKey="handballs_avg" shortLabel="H" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedStats.map((player, index) => (
                                <tr
                                    key={player.jumper_no}
                                    className={clsx(
                                        "transition-colors group cursor-default",
                                        index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]",
                                        "hover:bg-white/10"
                                    )}
                                >
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest font-space">{index + 1}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white shadow-2xl group-hover:bg-gold-500/10 group-hover:scale-110 transition-all duration-500 font-space">
                                                {player.jumper_no}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-lg font-black text-white group-hover:text-gold-400 transition-colors uppercase tracking-tight font-space">{player.name}</div>
                                                <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] font-work">{player.position}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={clsx("px-4 py-6 text-center font-black text-sm transition-all font-space", sortConfig.key === 'af_avg' ? "text-gold-400" : "text-white/60")}>{player.af_avg}</td>
                                    <td className={clsx("px-4 py-6 text-center font-black text-sm transition-all font-space", sortConfig.key === 'rating_points' ? "text-gold-400" : "text-white/60")}>{player.rating_points}</td>
                                    <td className={clsx("px-4 py-6 text-center font-black text-sm transition-all font-space", sortConfig.key === 'goals_avg' ? "text-gold-400" : "text-white/60")}>{player.goals_avg}</td>
                                    <td className={clsx(
                                        "px-4 py-6 text-center font-black transition-all font-space",
                                        sortConfig.key === 'disposals_avg' ? "text-gold-400 text-lg" : "text-white/60 text-sm"
                                    )}>
                                        {player.disposals_avg}
                                    </td>
                                    <td className={clsx("px-4 py-6 text-center font-black text-sm transition-all font-space", sortConfig.key === 'marks_avg' ? "text-gold-400" : "text-white/60")}>{player.marks_avg}</td>
                                    <td className={clsx("px-4 py-6 text-center font-black text-sm transition-all font-space", sortConfig.key === 'tackles_avg' ? "text-gold-400" : "text-white/60")}>{player.tackles_avg}</td>
                                    <td className={clsx("px-4 py-6 text-center font-black text-sm transition-all font-space", sortConfig.key === 'clearances_avg' ? "text-gold-400" : "text-white/60")}>{player.clearances_avg}</td>
                                    <td className={clsx("px-4 py-6 text-center font-black text-sm transition-all font-space", sortConfig.key === 'kicks_avg' ? "text-gold-400" : "text-white/60")}>{player.kicks_avg}</td>
                                    <td className={clsx("px-4 py-6 text-center font-black text-sm transition-all font-space", sortConfig.key === 'handballs_avg' ? "text-gold-400" : "text-white/60")}>{player.handballs_avg}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;
