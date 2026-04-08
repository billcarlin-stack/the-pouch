/*
  The Nest — Dashboard Page

  Primary landing page for coaches/staff.
  Displays high-level team insights and wellbeing stas.
*/

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import type { TeamInsights } from '../services/api';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Users,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import hfcLogo from '../assets/hfc-logo.png';
import { DailySchedule } from '../components/dashboard/DailySchedule';

const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-white/5 animate-pulse rounded ${className}`}></div>
);

const StatCard = ({ title, value, subtext, icon: Icon, trend, color, loading }: any) => {
    if (loading) return (
        <div className="premium-card p-6 h-36 flex flex-col justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-4 w-32" />
        </div>
    );

    return (
        <div className="premium-card p-6 flex items-start justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-gold-400/5 transition-colors duration-700"></div>
            <div className="space-y-1 relative z-10">
                <p className="stat-label">{title}</p>
                <h3 className="text-4xl stat-value group-hover:text-gold-400 transition-colors duration-300">{value}</h3>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-4 flex items-center gap-1.5 font-work ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span className={`p-1 rounded-full ${trend === 'up' ? 'bg-emerald-400/10' : 'bg-rose-400/10'}`}>
                        {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </span>
                    {subtext}
                </p>
            </div>
            <div className={clsx(
                "p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl relative z-10",
                color
            )}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    );
};

export const Dashboard = () => {
    const { user } = useAuth();
    const [insights, setInsights] = useState<TeamInsights | null>(null);
    const [injuries, setInjuries] = useState<any[]>([]);
    const [wbAlerts, setWbAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'player') return;
        const fetchData = async () => {
            try {
                const [ins, inj, wba] = await Promise.all([
                    ApiService.getTeamInsights(),
                    ApiService.getInjuries(),
                    ApiService.getWellbeingAlerts()
                ]);
                setInsights(ins);
                setInjuries(inj);
                setWbAlerts(wba);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Prepare chart data from daily_averages
    const chartData = insights?.daily_averages
        ? Object.entries(insights.daily_averages).map(([date, vals]: any) => ({
            date: date.split('-').slice(1).join('/'), // MM/DD
            ...vals
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [];

    const latestStats = chartData.length > 0 ? chartData[chartData.length - 1] : { sleep: 0, soreness: 0, stress: 0 };

    if (user?.role === 'player') {
        return <Navigate to={`/players/${user.jumper_no}`} replace />;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with Premium Branding */}
            <div className="flex items-center justify-between premium-card p-10 relative overflow-hidden bg-hfc-brown border-none shadow-gold-glow">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/10 rounded-full -mr-48 -mt-48 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 blur-[80px]"></div>
                
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="h-1 w-12 bg-gold-400 rounded-full"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-400/80">Command Center</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">Team Performance Hub</h1>
                    <p className="text-white/50 font-medium text-sm font-work italic">"Victory is in the details. Monitor the squad's vital metrics in real-time."</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl relative z-10 border border-white/10 group overflow-hidden">
                    <div className="absolute inset-0 bg-gold-400/0 group-hover:bg-gold-400/5 transition-colors duration-500"></div>
                    <img
                        src={hfcLogo}
                        alt="HFC Logo"
                        className="h-20 w-auto group-hover:scale-110 transition-transform duration-700 brightness-110"
                    />
                </div>
            </div>

            {/* KPI Cards section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    loading={loading}
                    title="Avg Sleep Quality"
                    value={latestStats.sleep}
                    subtext="Squad Average"
                    icon={Activity}
                    trend={latestStats.sleep > 7.5 ? "up" : "down"}
                    color="bg-indigo-600 shadow-indigo-600/20"
                />
                <StatCard
                    loading={loading}
                    title="Soreness Status"
                    value={latestStats.soreness}
                    subtext="Daily Trend"
                    icon={AlertTriangle}
                    trend={latestStats.soreness < 7 ? "down" : "up"}
                    color="bg-amber-500 shadow-amber-500/20"
                />
                <StatCard
                    loading={loading}
                    title="Squad Stress"
                    value={latestStats.stress}
                    subtext="Mental Load"
                    icon={Users}
                    trend="up"
                    color="bg-emerald-600 shadow-emerald-600/20"
                />
            </div>

            {/* Squad Fitness Performance Row */}
            <div className="premium-card p-10 bg-[#1A1411] border-white/5 shadow-gold-glow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gold-400/5 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:bg-gold-400/10 transition-all duration-1000"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3 font-space">
                        <div className="p-2 bg-gold-400/10 rounded-xl border border-gold-400/20">
                            <Zap className="text-gold-400" size={24} />
                        </div>
                        Squad Fitness Performance
                        <span className="text-[10px] text-gold-400 font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-[0.2em] ml-auto">
                            Latest Sessions (n={insights?.fitness_stats?.count || 0})
                        </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-3">
                            <div className="stat-label text-gold-400/60">Avg Peak Speed</div>
                            <div className="text-5xl stat-value text-white">
                                {insights?.fitness_stats?.avg_top_speed || '—'}
                                <span className="text-sm text-white/30 ml-2 font-work">km/h</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="stat-label text-gold-400/60">Avg Distance</div>
                            <div className="text-5xl stat-value text-white">
                                {insights?.fitness_stats?.avg_distance || '—'}
                                <span className="text-sm text-white/30 ml-2 font-work">km</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="stat-label text-gold-400">Avg Session Load</div>
                            <div className="text-5xl stat-value text-gold-400">
                                {insights?.fitness_stats?.avg_load || '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Schedule Dashboard Widget */}
                <div className="lg:col-span-1 h-[420px]">
                    <DailySchedule />
                </div>

                {/* Medical & Coaching Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Health & Wellbeing Alerts Panel */}
                    <div className="premium-card p-8">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white font-space uppercase tracking-tight">
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
                            Medical & Wellbeing Alerts
                        </h3>
                        <div className="space-y-4">
                            {loading ? (
                                <Skeleton className="h-24 w-full" />
                            ) : (
                                <>
                                    {/* Combine injuries and wellbeing notes */}
                                    {[
                                        ...injuries.filter(i => i.status === 'Active').map(i => ({ ...i, type: 'injury' })),
                                        ...wbAlerts.map(w => ({ ...w, type: 'wellbeing' }))
                                    ].sort((_, b) => b.type === 'injury' ? 1 : -1).slice(0, 5).map((alert, i) => (
                                        <div key={i} className={clsx(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02]",
                                            alert.type === 'injury' && alert.severity === 'Major' 
                                                ? "bg-rose-500/10 border-rose-500/20" 
                                                : "bg-gold-500/5 border-gold-500/10"
                                        )}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "font-black text-sm uppercase tracking-tight",
                                                        alert.type === 'injury' && alert.severity === 'Major' ? "text-rose-400" : "text-gold-400"
                                                    )}>{alert.player_name}</div>
                                                    <span className={clsx(
                                                        "text-[8px] font-black uppercase px-2 py-0.5 rounded border",
                                                        alert.type === 'injury' 
                                                            ? "bg-rose-500/20 text-rose-300 border-rose-500/20" 
                                                            : "bg-gold-500/20 text-gold-300 border-gold-500/20"
                                                    )}>
                                                        {alert.type}
                                                    </span>
                                                </div>
                                                <div className={clsx(
                                                    "text-xs mt-1 font-medium",
                                                    alert.type === 'injury' && alert.severity === 'Major' ? "text-rose-200/60" : "text-gold-200/60"
                                                )}>
                                                    {alert.type === 'injury' ? alert.injury_type : alert.notes}
                                                </div>
                                            </div>
                                            {alert.type === 'injury' && (
                                                <span className={clsx(
                                                    "text-[9px] font-bold uppercase px-3 py-1 rounded-full border",
                                                    alert.severity === 'Major' ? "bg-rose-500 text-white border-transparent shadow-lg shadow-rose-900/50" : "bg-gold-500/20 text-gold-400 border-gold-500/20"
                                                )}>
                                                    {alert.severity}
                                                </span>
                                            )}
                                            {alert.type === 'wellbeing' && (
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-gold-400 font-space tracking-tight">{alert.readiness?.toFixed(1) || '—'}</div>
                                                    <div className="stat-label !text-[8px]">Readiness</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {injuries.filter(i => i.status === 'Active').length === 0 && wbAlerts.length === 0 && (
                                        <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl group">
                                            <CheckCircle size={32} className="mx-auto mb-3 text-white/10 group-hover:text-emerald-500 transition-colors duration-500" />
                                            <p className="text-white/40 text-xs font-work uppercase tracking-widest">No critical alerts</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Automated Insights Panel */}
                    <div className="premium-card p-8">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white font-space uppercase tracking-tight">
                            <CheckCircle size={20} className="text-emerald-500" />
                            Coaching AI Insights
                        </h3>
                        <div className="space-y-4">
                            {loading ? (
                                <>
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                </>
                            ) : (
                                <>
                                    {(insights?.insights || []).map((text: string, i: number) => (
                                        <div key={i} className="p-4 bg-emerald-500/5 text-emerald-100 rounded-2xl text-xs border border-emerald-500/10 font-work leading-relaxed">
                                            {text}
                                        </div>
                                    ))}
                                    {!(insights?.insights?.length) && (
                                        <p className="text-white/30 text-xs font-work">No automated coaching alerts generated for this cycle.</p>
                                    )}
                                </>
                            )}

                            {/* Correct Availability based on real data */}
                            <div className="mt-10 pt-8 border-t border-white/5 space-y-6">
                                <h4 className="stat-label !text-xs !text-white/60">Squad Availability Status</h4>
                                {loading ? (
                                    <Skeleton className="h-24 w-full" />
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold font-work text-white/50 uppercase tracking-widest">Available (Full)</span>
                                                <span className="text-lg font-space font-black text-emerald-400">{44 - injuries.filter(i => i.status !== 'Cleared').length} <span className="text-[9px] text-white/30 font-work uppercase ml-1">PLAYERS</span></span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-emerald-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${((44 - injuries.filter(i => i.status !== 'Cleared').length) / 44) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold font-work text-white/50 uppercase tracking-widest">Modified / Rehab</span>
                                                <span className="text-lg font-space font-black text-gold-400">{injuries.filter(i => i.status !== 'Cleared').length} <span className="text-[9px] text-white/30 font-work uppercase ml-1">PLAYERS</span></span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-gold-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${(injuries.filter(i => i.status !== 'Cleared').length / 44) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
