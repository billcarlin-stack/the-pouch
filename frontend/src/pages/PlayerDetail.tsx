/*
  The Nest — Player Detail Page

  3-tab player profile:
    1. Personal Information (bio, engagement, education, community)
    2. Footy Overview (training plan, stats, IDP radar, WOOP goals, match ratings, injuries)
    3. Fitness Performance (GPS session, PBs)

  FIX: All useState/useEffect hooks are declared at the top of the component,
       BEFORE any early returns, to comply with React Rules of Hooks.
  FIX: Replaced Recharts with native SVG charts to resolve React 19 compatibility issues.
*/

import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiService, formatPlayerImage, getMatchRatings } from '../services/api';

import type { Player, Injury, PlayerStats, PlayerEngagement } from '../services/api';
import {
    ChevronLeft, Share2, Printer, Activity, Target,
    User, Trophy, MapPin, GraduationCap, Heart,
    BookOpen, Users, Dumbbell, Calendar, Award, Plus
} from 'lucide-react';
import clsx from 'clsx';
import { FitnessTab } from '../components/FitnessTab';
import AddPlayerToTeamModal from '../components/modals/AddPlayerToTeamModal';



// ─── Native SVG Charts ────────────────────────────────────────────────────────



const NativeMatchRatingsChart = ({ data, size }: { data: any[]; size: { w: number; h: number } }) => {
    if (!data || data.length === 0) return <div className="flex h-full items-center justify-center text-white/40 font-medium">No match rating data available.</div>;

    const padding = { top: 40, right: 20, bottom: 60, left: 20 };
    const chartW = size.w - padding.left - padding.right;
    const chartH = size.h - padding.top - padding.bottom;
    const barWidth = Math.min(25, (chartW / data.length) * 0.6);
    const xStep = chartW / (data.length || 1);

    const getY = (val: number) => padding.top + chartH - (val / 5) * chartH;

    const linePoints = data.map((d, i) => {
        const x = padding.left + i * xStep + xStep / 2;
        const y = getY(d.avg3);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
            {/* Bars */}
            {data.map((d, i) => {
                const x = padding.left + i * xStep + (xStep - barWidth) / 2;
                const h = (d.rating / 5) * chartH;
                const y = padding.top + chartH - h;
                const color = d.rating >= 4 ? '#10B981' : d.rating >= 3 ? '#F59E0B' : '#EF4444';
                
                return (
                    <g key={`bar-${i}`}>
                        <rect x={x} y={y} width={barWidth} height={h} fill={color} fillOpacity="0.8" rx="4" />
                        <text
                            x={padding.left + i * xStep + xStep / 2}
                            y={size.h - padding.bottom + 20}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.3)"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="Space Grotesk"
                            transform={`rotate(-45, ${padding.left + i * xStep + xStep / 2}, ${size.h - padding.bottom + 20})`}
                        >
                            {d.round}
                        </text>
                    </g>
                );
            })}

            {/* Line for 3-Match Avg */}
            <polyline
                points={linePoints}
                fill="none"
                stroke="#F6B000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            
            {/* Line Dots */}
            {data.map((d, i) => {
                const x = padding.left + i * xStep + xStep / 2;
                const y = getY(d.avg3);
                return (
                    <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="#F6B000" stroke="#0F0A07" strokeWidth="1.5" />
                );
            })}
        </svg>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProfileHeader = ({ player, stats2025, isCoach }: { player: Player; stats2025: PlayerStats | null; isCoach: boolean }) => (
    <div className="premium-card p-10 bg-hfc-brown border-none shadow-gold-glow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-[120px] group-hover:bg-gold-400/10 transition-all duration-1000" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            {/* Photo */}
            <div className="relative">
                <div className="absolute inset-0 bg-gold-400 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="w-48 h-48 rounded-full border-2 border-gold-400/30 p-1.5 bg-[#1A1411] shadow-2xl relative z-10 overflow-hidden">
                    <img
                        src={formatPlayerImage(player.jumper_no, player.photo_url, player.name)}
                        alt={player.name}
                        className="w-full h-full object-cover rounded-full grayscale-[20%] hover:grayscale-0 transition-all duration-700 hover:scale-105"
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=4D2004&color=F6B000&size=200&length=2&font-size=0.4`;
                        }}
                    />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold-500 text-[#0F0A07] text-[10px] font-black px-4 py-1.5 rounded-full shadow-[0_5px_15px_rgba(246,176,0,0.4)] z-20 uppercase tracking-widest font-space">
                    #{player.jumper_no}
                </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1 space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="h-[1px] w-8 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-400/80 font-work">Elite Profile</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">{player.name}</h1>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] font-work italic">
                    <span>{player.position}</span>
                    <span className="text-gold-500/30">/</span>
                    <span>{player.originally_from || 'VIC Metro'}</span>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-10 pt-4">
                    {[
                        { value: player.age, label: 'Age' },
                        { value: player.height_cm, label: 'Height (cm)' },
                        { value: player.weight_kg, label: 'Weight (kg)' },
                        { value: player.games, label: 'Games', gold: true },
                    ].map(({ value, label, gold }) => (
                        <div key={label} className="text-center md:text-left">
                            <div className={`text-4xl stat-value ${gold ? 'text-gold-400' : 'text-white'}`}>{value}</div>
                            <div className="stat-label !text-[8px] opacity-50 mt-1">{label}</div>
                        </div>
                    ))}
                </div>

                {stats2025 && (
                    <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap justify-center md:justify-start gap-x-10 gap-y-6">
                        {[
                            { label: 'AF Avg', value: stats2025.af_avg },
                            { label: 'Disposals', value: stats2025.disposals_avg },
                            { label: 'Marks', value: stats2025.marks_avg },
                            { label: 'Tackles', value: stats2025.tackles_avg },
                            { label: 'Goals', value: stats2025.goals_avg },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col">
                                <span className="stat-label !text-[7px] text-gold-400/60 mb-2">{label}</span>
                                <span className="text-xl font-black text-white font-space">{Number(value ?? 0).toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Readiness */}
            <div className="hidden md:flex flex-col items-end gap-6">
                <div className="text-right group">
                    <div className="stat-label !text-[9px] mb-2 opacity-50">Match Readiness</div>
                    <div className={`text-7xl font-space font-black tracking-tighter ${player.readiness && player.readiness.score > 8 ? 'text-emerald-400' : 'text-gold-400'} group-hover:scale-105 transition-transform duration-500`}>
                        {player.readiness?.score ? Number(player.readiness.score).toFixed(1) : '—'}
                    </div>
                </div>
                
                {isCoach && (
                    <button 
                        onClick={() => (window as any).openTeamModal?.()}
                        className="flex items-center gap-3 px-8 py-4 bg-gold-500 text-[#0F0A07] rounded-full font-black text-[10px] uppercase tracking-[0.2em] font-work hover:bg-white hover:scale-105 transition-all shadow-[0_10px_30px_-5px_rgba(246,176,0,0.4)]"
                    >
                        <Plus size={16} />
                        Assign to Squad
                    </button>
                )}
            </div>
        </div>
    </div>
);


const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | boolean | number | null }) => {
    if (value === null || value === undefined || value === '') return null;
    const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    return (
        <div className="flex items-start gap-4 py-4 border-b border-white/5 last:border-0 group">
            <div className="p-2 bg-white/5 rounded-lg text-gold-400 transition-colors group-hover:bg-gold-400/10 group-hover:text-gold-300">
                <Icon size={14} className="flex-shrink-0" />
            </div>
            <div className="flex-1 flex justify-between items-center">
                <span className="stat-label !text-[8px] opacity-40">{label}</span>
                <span className="text-xs font-bold text-white/80 text-right font-work uppercase tracking-wider">{display}</span>
            </div>
        </div>
    );
};

const Card = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="premium-card p-8">
        <h3 className="font-black text-xs text-white mb-6 flex items-center gap-3 uppercase tracking-[0.2em] font-space">
            <div className="p-2 bg-white/5 rounded-xl text-gold-400">
                <Icon size={18} />
            </div>
            {title}
        </h3>
        <div className="mt-4">
            {children}
        </div>
    </div>
);

const TierBadge = ({ tier }: { tier?: number | null }) => {
    const colors = ['', 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', 'bg-blue-500/10 text-blue-400 border border-blue-500/20', 'bg-gold-500/10 text-gold-400 border border-gold-500/20', 'bg-rose-500/10 text-rose-400 border border-rose-500/20'];
    const labels = ['', 'Tier 1 — Light', 'Tier 2 — Moderate', 'Tier 3 — High', 'Tier 4 — Elite'];
    if (!tier) return <span className="text-white/40 text-sm">—</span>;
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${colors[tier] ?? 'bg-white/5 text-white/80'}`}>
            {labels[tier] ?? `Tier ${tier}`}
        </span>
    );
};

const AttributeCard = ({ title, text }: { title: string; text?: string }) => (
    <div className="premium-card p-6 flex flex-col h-full bg-hfc-brown border-none shadow-gold-glow-none hover:shadow-gold-glow transition-all duration-500 group">
        <h3 className="stat-label !text-[8px] text-gold-400 mb-2 group-hover:text-white transition-colors uppercase tracking-[0.3em]">{title}</h3>
        <p className="text-white font-space font-black text-xl leading-tight uppercase group-hover:text-gold-400 transition-colors">{text || '—'}</p>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export const PlayerDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const isCoach = user?.role === 'coach' || user?.role === 'admin';


    // ── ALL hooks must be declared here, before any early returns ──
    const [player, setPlayer] = useState<Player | null>(null);
    const [matchRatings, setMatchRatings] = useState<any[]>([]);

    const [playerInjuries, setPlayerInjuries] = useState<Injury[]>([]);
    const [stats2025, setStats2025] = useState<PlayerStats | null>(null);
    const [latestWellbeing, setLatestWellbeing] = useState<any>(null);
    const [woopGoals, setWoopGoals] = useState<any[]>([]);
    const [fitnessSession, setFitnessSession] = useState<any>(null);
    const [fitnessPBs, setFitnessPBs] = useState<any>(null);
    const [engagement, setEngagement] = useState<PlayerEngagement | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'footy' | 'fitness'>('personal');
    const [showTeamModal, setShowTeamModal] = useState(false);

    const chartRef = useRef<HTMLDivElement>(null);

    const [chartSize, setChartSize] = useState({ w: 500, h: 300 });

    useEffect(() => {
        const obs = new ResizeObserver(() => {
            if (chartRef.current) {
                setChartSize({ w: chartRef.current.offsetWidth, h: chartRef.current.offsetHeight });
            }
        });
        if (chartRef.current) obs.observe(chartRef.current);
        return () => obs.disconnect();
    }, []);


    useEffect(() => {
        if (id) {
            Promise.allSettled([
                ApiService.getPlayer(id),
                ApiService.getInjuries(),
                ApiService.getStats2025({ jumper_no: Number(id) }),
                ApiService.getWellbeing(id, 1),
                ApiService.getWoopGoals(Number(id)),
                ApiService.getFitnessSession(id),

                ApiService.getFitnessPbs(id),
                ApiService.getEngagement(id),
            ]).then(([p, allInj, s, w, woop, fitS, fitP, eng]) => {

                if (p.status === 'fulfilled' && p.value) {
                    setPlayer(p.value);
                    if (p.value.jumper_no) {
                        setMatchRatings(getMatchRatings(p.value.jumper_no));
                    }
                }
                if (allInj.status === 'fulfilled' && Array.isArray(allInj.value)) setPlayerInjuries(allInj.value.filter((i: Injury) => i.player_id === Number(id)));

                if (s.status === 'fulfilled' && Array.isArray(s.value) && s.value.length > 0) setStats2025(s.value[0]);
                if (w.status === 'fulfilled' && Array.isArray(w.value) && w.value.length > 0) setLatestWellbeing(w.value[0]);
                if (woop.status === 'fulfilled' && Array.isArray(woop.value)) setWoopGoals(woop.value);
                if (fitS.status === 'fulfilled') setFitnessSession(fitS.value?.session ?? null);
                if (fitP.status === 'fulfilled') setFitnessPBs(fitP.value?.pbs ?? null);
                if (eng.status === 'fulfilled') setEngagement(eng.value?.engagement ?? null);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [id]);



    // Expose modal toggle to sub-component
    useEffect(() => {
        (window as any).openTeamModal = () => setShowTeamModal(true);
        return () => { delete (window as any).openTeamModal; };
    }, []);

    // ── Early returns AFTER all hooks ──
    if (loading) return <div className="p-20 text-center text-white/40">Loading Profile...</div>;
    if (!player) return <div className="p-20 text-center text-white/40">Player not found</div>;

    // ── Derived state (computed after hooks) ──
    const chartMatchData = matchRatings.map((m, idx) => {
        const last3 = matchRatings.slice(Math.max(0, idx - 2), idx + 1);
        const sum = last3.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        return { ...m, avg3: Number((last3.length > 0 ? sum / last3.length : 0).toFixed(1)) };
    });



    const matchAvg = matchRatings.length > 0
        ? (matchRatings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / matchRatings.length).toFixed(1)
        : '0.0';

    const TABS = [
        { key: 'personal', label: 'Personal Info', icon: User },
        { key: 'footy',    label: 'Footy Overview', icon: Trophy },
        { key: 'fitness',  label: 'Fitness Performance', icon: Activity },
    ] as const;

    const studyDays = [
        engagement?.study_monday && 'Monday',
        engagement?.study_wednesday && 'Wednesday',
        engagement?.study_thursday && 'Thursday',
    ].filter(Boolean).join(', ') || 'None';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            {showTeamModal && player && (
                <AddPlayerToTeamModal 
                    player={player} 
                    onClose={() => setShowTeamModal(false)} 
                    onSuccess={() => {
                        // Optionally refresh data
                    }}
                />
            )}
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Link to="/players" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium">
                    <ChevronLeft size={20} />
                    Back to Squad
                </Link>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-gold-400 transition-colors"><Share2 size={18} /></button>
                    <button className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-gold-400 transition-colors"><Printer size={18} /></button>
                </div>
            </div>

            {/* Header */}
            <ProfileHeader player={player} stats2025={stats2025} isCoach={isCoach} />


            {/* Tab Navigation */}
            <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-md border border-white/5 rounded-[2rem] w-fit">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={clsx(
                            "flex items-center gap-2 px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 font-work",
                            activeTab === key
                                ? "bg-gold-500 text-[#0F0A07] shadow-[0_10px_20px_rgba(246,176,0,0.3)]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Icon size={14} className={activeTab === key ? "text-[#0F0A07]" : "text-white/20"} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Personal Information ─────────────────────────────────────────── */}
            {activeTab === 'personal' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Player Attribute Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <AttributeCard title="Weapon" text={player.description?.weapon} />
                        <AttributeCard title="Craft" text={player.description?.craft} />
                        <AttributeCard title="Pyramid" text={player.description?.pyramid} />
                        <AttributeCard title="Mental Skills" text={player.description?.mental} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                        {/* Personal Details */}
                        <Card title="Personal Details" icon={User}>
                            <InfoRow icon={MapPin} label="State Origin" value={engagement?.state} />
                            <InfoRow icon={Calendar} label="Date of Birth" value={engagement?.dob ? new Date(engagement.dob).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                            <InfoRow icon={Award} label="Listing Type" value={engagement?.listing} />
                            <InfoRow icon={Users} label="Has Children" value={engagement?.has_children} />
                            <InfoRow icon={MapPin} label="Area of Schooling" value={engagement?.area_of_schooling} />
                            <InfoRow icon={Activity} label="Program" value={engagement?.program} />
                        </Card>

                        {/* Education */}
                        <Card title="Education & Study" icon={GraduationCap}>
                            <InfoRow icon={BookOpen} label="Course / Degree" value={engagement?.education_study} />
                            <InfoRow icon={GraduationCap} label="University / Institution" value={engagement?.university} />
                            <InfoRow icon={Calendar} label="Study Days" value={studyDays} />
                            <InfoRow icon={Award} label="Certificate 1" value={engagement?.certificate_1} />
                            <InfoRow icon={Award} label="Certificate 2" value={engagement?.certificate_2} />
                        </Card>

                        {/* Body & Physical */}
                        <Card title="Physical Profile" icon={Dumbbell}>
                            <div className="mb-4">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Body Load Tier</p>
                                <TierBadge tier={engagement?.body_load_tier} />
                            </div>
                            <InfoRow icon={Target} label="Body Goal" value={engagement?.body_goal} />
                            <div className="pt-3 border-t border-white/5 mt-2">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Physical Stats</p>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    <div className="text-center bg-[#1A1411] rounded-xl p-3">
                                        <div className="text-lg font-bold text-white">{player.age}</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Age</div>
                                    </div>
                                    <div className="text-center bg-[#1A1411] rounded-xl p-3">
                                        <div className="text-lg font-bold text-white">{player.height_cm}</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Height</div>
                                    </div>
                                    <div className="text-center bg-[#1A1411] rounded-xl p-3">
                                        <div className="text-lg font-bold text-white">{player.weight_kg}</div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Weight</div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Community & Engagement */}
                        <Card title="Community & Engagement" icon={Heart}>
                            <div className="mb-4 flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${engagement?.community_engaged ? 'bg-green-400' : 'bg-white/20'}`} />
                                <span className={`text-sm font-bold ${engagement?.community_engaged ? 'text-emerald-400' : 'text-white/40'}`}>
                                    {engagement?.community_engaged ? 'Community Active' : 'Not Currently Active'}
                                </span>
                            </div>
                            {engagement?.engagement_notes && (
                                <div className="p-4 bg-gold-400/5 rounded-xl border border-gold-400/10">
                                    <p className="text-xs font-bold text-gold-400 uppercase tracking-widest mb-1">Engagement Notes</p>
                                    <p className="text-sm text-white/80 leading-relaxed">{engagement.engagement_notes}</p>
                                </div>
                            )}
                        </Card>

                        {/* Latest Wellbeing */}
                        {latestWellbeing && (
                            <Card title="Pulse Wellbeing" icon={Activity}>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {[
                                        { label: 'Sleep', value: latestWellbeing.sleep_score },
                                        { label: 'Soreness', value: latestWellbeing.soreness_score },
                                        { label: 'Mood', value: 10 - Number(latestWellbeing.stress_score || 0) },
                                        { label: 'Readiness', value: ((Number(latestWellbeing.sleep_score || 0) + Number(latestWellbeing.soreness_score || 0) + (10 - Number(latestWellbeing.stress_score || 0))) / 3).toFixed(1), gold: true },
                                    ].map(({ label, value, gold }: any) => (
                                        <div key={label} className="text-center bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-gold-400/20 transition-all duration-300">
                                            <div className={`text-2xl font-black font-space ${gold ? 'text-gold-400' : 'text-white'}`}>{value}</div>
                                            <div className="stat-label !text-[7px] opacity-40 mt-1 uppercase tracking-widest">{label}</div>
                                        </div>
                                    ))}
                                </div>
                                {latestWellbeing.notes && (
                                    <div className="p-4 bg-gold-400/5 rounded-2xl border border-gold-400/10 italic text-white/60 text-xs font-work leading-relaxed">
                                        "{latestWellbeing.notes}"
                                    </div>
                                )}
                                <div className="mt-4 flex items-center gap-2 px-3">
                                    <div className="h-1 w-1 rounded-full bg-gold-400/40"></div>
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">
                                        Last Sync: {new Date(latestWellbeing.submitted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Footy Overview ───────────────────────────────────────────────── */}
            {activeTab === 'footy' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">



                        {/* Match Ratings */}
                        <div className="premium-card p-10">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <div className="stat-label !text-[8px] text-gold-400/60 uppercase tracking-[0.3em]">Season Trajectory</div>
                                    <h3 className="font-black text-2xl text-white uppercase font-space tracking-tight">Match Performance</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-gold-400 font-space tracking-tighter">{matchAvg}</div>
                                    <div className="stat-label !text-[7px] opacity-40 uppercase tracking-widest last:!mr-0">Season Avg ({matchRatings.length} Games)</div>
                                </div>
                            </div>
                            <div ref={chartRef} className="h-80 w-full relative">
                                <div className="absolute inset-0 bg-gold-400/[0.02] rounded-3xl pointer-events-none"></div>
                                <NativeMatchRatingsChart data={chartMatchData} size={chartSize} />
                            </div>
                        </div>

                        {/* Season Stats */}
                        {stats2025 && (
                            <div className="premium-card p-10">
                                <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
                                    <div className="p-2.5 bg-white/5 rounded-2xl text-gold-400 shadow-lg">
                                        <Trophy size={20} />
                                    </div>
                                    <div>
                                        <div className="stat-label !text-[8px] text-gold-400/60 uppercase tracking-[0.3em]">Historical Data</div>
                                        <h3 className="font-black text-xl text-white uppercase font-space tracking-tight">2025 Season Averages</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Games', value: stats2025.games_played },
                                        { label: 'AF Score', value: stats2025.af_avg },
                                        { label: 'Disposals', value: stats2025.disposals_avg },
                                        { label: 'Kicks', value: stats2025.kicks_avg },
                                        { label: 'Handballs', value: stats2025.handballs_avg },
                                        { label: 'Marks', value: stats2025.marks_avg },
                                        { label: 'Tackles', value: stats2025.tackles_avg },
                                        { label: 'Clearances', value: stats2025.clearances_avg },
                                        { label: 'Goals', value: stats2025.goals_avg },
                                        { label: 'Hitouts', value: stats2025.hitouts_avg },
                                        { label: 'Rating Pts', value: stats2025.rating_points },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="text-center bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-gold-400/20 transition-all duration-300 group">
                                            <div className="text-xl font-black text-white font-space group-hover:text-gold-400 transition-colors">
                                                {typeof value !== 'undefined' && value !== null ? Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1) : '—'}
                                            </div>
                                            <div className="stat-label !text-[7px] opacity-40 uppercase tracking-widest mt-1">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Injury History */}
                        <div className="premium-card p-10">
                            <h3 className="font-black text-xl text-white mb-8 flex items-center gap-3 font-space uppercase tracking-tight">
                                <div className="p-2.5 bg-rose-500/10 rounded-2xl text-rose-500 shadow-lg shadow-rose-900/20">
                                    <Activity size={24} />
                                </div>
                                Medical History Log
                            </h3>
                            <div className="overflow-hidden rounded-[2rem] border border-white/5">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-white/5 text-white/30 font-bold font-work uppercase tracking-[0.2em] text-[9px]">
                                        <tr>
                                            <th className="py-5 px-6">Entry Date</th>
                                            <th className="py-5 px-6">Condition</th>
                                            <th className="py-5 px-6">Severity</th>
                                            <th className="py-5 px-6 text-right">Clearance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {playerInjuries.map((inj, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="py-5 px-6 text-white/40 font-work text-[11px]">{inj.date}</td>
                                                <td className="py-5 px-6 font-black text-white uppercase tracking-tight text-sm font-space group-hover:text-rose-400 transition-colors">{inj.injury_type}</td>
                                                <td className="py-5 px-6">
                                                    <span className={clsx(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                        inj.severity === 'Major' ? 'bg-rose-500/20 text-rose-300 border-rose-500/20' :
                                                            inj.severity === 'Moderate' ? 'bg-gold-500/20 text-gold-300 border-gold-500/20' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                                                    )}>
                                                        {inj.severity}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className={clsx("w-1.5 h-1.5 rounded-full shadow-lg",
                                                            inj.status === 'Active' ? 'bg-rose-500 shadow-rose-500/50' : 
                                                            inj.status === 'Recovering' ? 'bg-gold-500 shadow-gold-500/50' : 
                                                            'bg-emerald-500 shadow-emerald-500/50'
                                                        )} />
                                                        <span className="text-white/60 font-black uppercase tracking-widest text-[9px] font-work">{inj.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {playerInjuries.length === 0 && (
                                            <tr><td colSpan={4} className="py-16 text-center text-white/20 font-work uppercase tracking-widest text-[10px] italic">Fully fit — No medical history recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* WOOP Goals */}
                    <div className="premium-card p-10">
                        <h3 className="font-black text-xl text-white mb-10 flex items-center gap-4 font-space uppercase tracking-tight">
                            <div className="p-2.5 bg-white/5 rounded-2xl text-gold-400 shadow-lg">
                                <Target size={24} />
                            </div>
                            WOOP Framework — Vision & Strategy
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {woopGoals.length > 0 ? woopGoals.map((goal, idx) => (
                                <div key={idx} className="p-8 rounded-[2.5rem] bg-gold-400/5 border border-gold-400/10 space-y-6 group hover:bg-gold-400/10 transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <h4 className="font-black text-white text-2xl uppercase tracking-tight font-space group-hover:text-gold-400 transition-colors leading-none">{goal.wish}</h4>
                                        <span className={clsx(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg",
                                            goal.status === 'active' ? "bg-gold-500 text-[#0F0A07] border-transparent" : "bg-emerald-500 text-white border-transparent"
                                        )}>
                                            {goal.status}
                                        </span>
                                    </div>
                                    <div className="grid gap-6 text-[11px] font-work relative z-10">
                                        <div>
                                            <span className="stat-label !text-[8px] text-gold-400/60 block mb-2 opacity-100 uppercase tracking-[0.3em]">The Outcome</span>
                                            <p className="text-white/80 font-medium leading-relaxed italic">"{goal.outcome}"</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <span className="stat-label !text-[8px] text-rose-400/60 block mb-2 opacity-100 uppercase tracking-[0.3em]">The Obstacle</span>
                                                <p className="text-white/60 font-medium leading-relaxed">{goal.obstacle}</p>
                                            </div>
                                            <div>
                                                <span className="stat-label !text-[8px] text-emerald-400/60 block mb-2 opacity-100 uppercase tracking-[0.3em]">The Plan</span>
                                                <p className="text-white/60 font-medium leading-relaxed">{goal.plan}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full p-16 text-center border border-dashed border-white/10 rounded-[3rem]">
                                    <Target size={40} className="mx-auto mb-4 text-white/5" />
                                    <p className="text-white/20 font-work uppercase tracking-widest text-xs italic">Awaiting strategic goal input...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Fitness Performance ──────────────────────────────────────────── */}
            {activeTab === 'fitness' && (
                <div className="premium-card p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 border-none shadow-gold-glow-none">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-2xl text-gold-400 shadow-xl">
                                <Activity size={28} />
                            </div>
                            <div>
                                <div className="stat-label !text-[8px] text-gold-400/60 uppercase tracking-[0.3em]">GPS Telemetry</div>
                                <h3 className="font-black text-2xl text-white uppercase font-space tracking-tight">Fitness & Kinectic Performance</h3>
                            </div>
                        </div>
                        {fitnessSession && (
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] px-5 py-2 bg-white/5 rounded-full border border-white/5">
                                    Last Sync: {new Date(fitnessSession.session_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        )}

                    </div>
                    <div className="rounded-[2.5rem] overflow-hidden">
                        <FitnessTab
                            session={fitnessSession}
                            pbs={fitnessPBs}
                            playerName={player.name}
                            isInjured={player.status !== 'Green'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
