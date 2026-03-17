/*
  The Nest — Player Detail Page

  3-tab player profile:
    1. Personal Information (bio, engagement, education, community)
    2. Footy Overview (training plan, stats, IDP radar, WOOP goals, match ratings, injuries)
    3. Fitness Performance (GPS session, PBs, phase-of-play filtering)
*/

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiService, formatPlayerImage, getMatchRatings } from '../services/api';
import type { Player, Injury, PlayerStats, PlayerEngagement } from '../services/api';
import {
    ChevronLeft, Share2, Printer, Activity, Target,
    User, Trophy, MapPin, GraduationCap, Heart,
    BookOpen, Users, Dumbbell, Calendar, Award
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
    Tooltip, Cell, Legend
} from 'recharts';
import { FitnessTab } from '../components/FitnessTab';

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProfileHeader = ({ player, stats2025 }: { player: Player; stats2025: PlayerStats | null }) => (
    <div className="bg-hfc-brown rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-hfc-brown/20 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Photo */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gold-400 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="w-40 h-40 rounded-full border-4 border-gold-400 p-1 bg-hfc-brown shadow-lg relative z-10">
                    <img
                        src={formatPlayerImage(player.jumper_no, player.photo_url, player.name)}
                        alt={player.name}
                        className="w-full h-full object-cover rounded-full bg-gray-800"
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=4D2004&color=F6B000&size=200&length=2&font-size=0.4`;
                        }}
                    />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gold-400 text-hfc-brown text-sm font-bold px-3 py-1 rounded-full shadow-md z-20">
                    #{player.jumper_no}
                </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{player.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-amber-200 text-sm font-medium uppercase tracking-wider mb-4">
                    <span>{player.position}</span>
                    <span className="text-gold-400">•</span>
                    <span>{player.originally_from || 'VIC Metro'}</span>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-6">
                    {[
                        { value: player.age, label: 'Age' },
                        { value: player.height_cm, label: 'Height (cm)' },
                        { value: player.weight_kg, label: 'Weight (kg)' },
                        { value: player.games, label: 'Games', gold: true },
                    ].map(({ value, label, gold }) => (
                        <div key={label} className="text-center">
                            <div className={`text-2xl font-bold ${gold ? 'text-gold-400' : 'text-white'}`}>{value}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest">{label}</div>
                        </div>
                    ))}
                </div>

                {stats2025 && (
                    <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4">
                        {[
                            { label: 'AF Avg', value: stats2025.af_avg },
                            { label: 'Disposals', value: stats2025.disposals_avg },
                            { label: 'Marks', value: stats2025.marks_avg },
                            { label: 'Tackles', value: stats2025.tackles_avg },
                            { label: 'Goals', value: stats2025.goals_avg },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col">
                                <span className="text-[10px] text-amber-300 font-black uppercase tracking-widest mb-1">{label}</span>
                                <span className="text-xl font-black text-white">{(value ?? 0).toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Readiness */}
            <div className="hidden md:block text-right">
                <div className={`text-6xl font-black ${player.readiness && player.readiness.score > 8 ? 'text-green-400' : 'text-gold-400'}`}>
                    {player.readiness?.score?.toFixed(1) || '—'}
                </div>
                <div className="text-xs text-amber-300 uppercase tracking-widest">Readiness</div>
            </div>
        </div>
    </div>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | boolean | number | null }) => {
    if (value === null || value === undefined || value === '') return null;
    const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
            <Icon size={16} className="text-gold-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{display}</span>
            </div>
        </div>
    );
};

const Card = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-base text-gray-900 mb-4 flex items-center gap-2 border-b-2 border-gold-400 pb-2">
            <Icon size={18} className="text-hfc-brown" />
            {title}
        </h3>
        {children}
    </div>
);

const TierBadge = ({ tier }: { tier?: number | null }) => {
    const colors = ['', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-red-100 text-red-700'];
    const labels = ['', 'Tier 1 — Light', 'Tier 2 — Moderate', 'Tier 3 — High', 'Tier 4 — Elite'];
    if (!tier) return <span className="text-gray-400 text-sm">—</span>;
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${colors[tier] ?? 'bg-gray-100 text-gray-600'}`}>
            {labels[tier] ?? `Tier ${tier}`}
        </span>
    );
};

const AttributeCard = ({ title, text }: { title: string; text?: string }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
        <h3 className="text-gold-600 text-xs font-bold uppercase tracking-widest mb-2">{title}</h3>
        <p className="text-gray-800 font-medium text-lg leading-snug">{text || '—'}</p>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export const PlayerDetail = () => {
    const { id } = useParams();
    const [player, setPlayer] = useState<Player | null>(null);
    const [matchRatings, setMatchRatings] = useState<any[]>([]);
    const [aggregatedRatings, setAggregatedRatings] = useState<any[]>([]);
    const [playerInjuries, setPlayerInjuries] = useState<Injury[]>([]);
    const [stats2025, setStats2025] = useState<PlayerStats | null>(null);
    const [latestWellbeing, setLatestWellbeing] = useState<any>(null);
    const [woopGoals, setWoopGoals] = useState<any[]>([]);
    const [fitnessSession, setFitnessSession] = useState<any>(null);
    const [fitnessPBs, setFitnessPBs] = useState<any>(null);
    const [engagement, setEngagement] = useState<PlayerEngagement | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'footy' | 'fitness'>('personal');
    const [selectedPhases, setSelectedPhases] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            Promise.allSettled([
                ApiService.getPlayer(id),
                ApiService.getRatings(id),
                ApiService.getInjuries(),
                ApiService.getStats2025({ jumper_no: Number(id) }),
                ApiService.getWellbeing(id, 1),
                ApiService.getWoopGoals(Number(id)),
                ApiService.getFitnessSession(id, selectedPhases),
                ApiService.getFitnessPbs(id),
                ApiService.getEngagement(id),
            ]).then(([p, r, allInj, s, w, woop, fitS, fitP, eng]) => {
                if (p.status === 'fulfilled') {
                    setPlayer(p.value);
                    setMatchRatings(getMatchRatings(p.value.jumper_no));
                }
                if (r.status === 'fulfilled') setAggregatedRatings(r.value.aggregated);
                if (allInj.status === 'fulfilled') setPlayerInjuries(allInj.value.filter((i: Injury) => i.player_id === Number(id)));
                if (s.status === 'fulfilled' && s.value.length > 0) setStats2025(s.value[0]);
                if (w.status === 'fulfilled' && w.value.length > 0) setLatestWellbeing(w.value[0]);
                if (woop.status === 'fulfilled') setWoopGoals(woop.value);
                if (fitS.status === 'fulfilled') setFitnessSession(fitS.value.session);
                if (fitP.status === 'fulfilled') setFitnessPBs(fitP.value.pbs);
                if (eng.status === 'fulfilled') setEngagement(eng.value.engagement);
            }).finally(() => setLoading(false));
        }
    }, [id]);

    useEffect(() => {
        if (id && !loading) {
            ApiService.getFitnessSession(id, selectedPhases).then(res => {
                setFitnessSession(res.session);
            }).catch(console.error);
        }
    }, [selectedPhases, id]);

    if (loading) return <div className="p-20 text-center text-gray-400">Loading Profile...</div>;
    if (!player) return <div className="p-20 text-center text-gray-400">Player not found</div>;

    const chartMatchData = matchRatings.map((m, idx) => {
        const last3 = matchRatings.slice(Math.max(0, idx - 2), idx + 1);
        const sum = last3.reduce((s, r) => s + (r.rating || 0), 0);
        return { ...m, avg3: Number((last3.length > 0 ? sum / last3.length : 0).toFixed(1)) };
    });

    const idpData = aggregatedRatings.map(r => ({
        subject: r.category, Coach: r.coach, Self: r.self, Squad: r.squad, fullMark: 10,
    }));

    const compositeScore = idpData.length > 0
        ? (idpData.reduce((sum, d) => sum + (d.Coach || 0), 0) / idpData.length).toFixed(1)
        : '0.0';

    const matchAvg = matchRatings.length > 0
        ? (matchRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / matchRatings.length).toFixed(1)
        : '0.0';

    const TABS = [
        { key: 'personal', label: 'Personal Info', icon: User },
        { key: 'footy',    label: 'Footy Overview', icon: Trophy },
        { key: 'fitness',  label: 'Fitness Performance', icon: Activity },
    ] as const;

    // Study days for display
    const studyDays = [
        engagement?.study_monday && 'Monday',
        engagement?.study_wednesday && 'Wednesday',
        engagement?.study_thursday && 'Thursday',
    ].filter(Boolean).join(', ') || 'None';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Link to="/players" className="flex items-center gap-2 text-gray-500 hover:text-hfc-brown transition-colors font-medium">
                    <ChevronLeft size={20} />
                    Back to Squad
                </Link>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-amber-600 transition-colors"><Share2 size={18} /></button>
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-amber-600 transition-colors"><Printer size={18} /></button>
                </div>
            </div>

            {/* Header */}
            <ProfileHeader player={player} stats2025={stats2025} />

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-gray-100/50 rounded-2xl w-fit">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300",
                            activeTab === key
                                ? "bg-hfc-brown text-white shadow-lg"
                                : "text-gray-400 hover:text-gray-600 hover:bg-white"
                        )}
                    >
                        <Icon size={15} />
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
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Body Load Tier</p>
                                <TierBadge tier={engagement?.body_load_tier} />
                            </div>
                            <InfoRow icon={Target} label="Body Goal" value={engagement?.body_goal} />
                            <div className="pt-3 border-t border-gray-50 mt-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Physical Stats</p>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    <div className="text-center bg-gray-50 rounded-xl p-3">
                                        <div className="text-lg font-bold text-hfc-brown">{player.age}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Age</div>
                                    </div>
                                    <div className="text-center bg-gray-50 rounded-xl p-3">
                                        <div className="text-lg font-bold text-hfc-brown">{player.height_cm}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Height</div>
                                    </div>
                                    <div className="text-center bg-gray-50 rounded-xl p-3">
                                        <div className="text-lg font-bold text-hfc-brown">{player.weight_kg}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Weight</div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Community & Engagement */}
                        <Card title="Community & Engagement" icon={Heart}>
                            <div className="mb-4 flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${engagement?.community_engaged ? 'bg-green-400' : 'bg-gray-300'}`} />
                                <span className={`text-sm font-bold ${engagement?.community_engaged ? 'text-green-600' : 'text-gray-400'}`}>
                                    {engagement?.community_engaged ? 'Community Active' : 'Not Currently Active'}
                                </span>
                            </div>
                            {engagement?.engagement_notes && (
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Engagement Notes</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{engagement.engagement_notes}</p>
                                </div>
                            )}
                        </Card>

                        {/* Latest Wellbeing */}
                        {latestWellbeing && (
                            <Card title="Latest Wellbeing Check-In" icon={Activity}>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {[
                                        { label: 'Sleep', value: latestWellbeing.sleep_score },
                                        { label: 'Soreness', value: latestWellbeing.soreness_score },
                                        { label: 'Mood', value: 10 - latestWellbeing.stress_score },
                                        { label: 'Readiness', value: ((latestWellbeing.sleep_score + latestWellbeing.soreness_score + (10 - latestWellbeing.stress_score)) / 3).toFixed(1), gold: true },
                                    ].map(({ label, value, gold }: any) => (
                                        <div key={label} className="text-center bg-gray-50 rounded-xl p-3">
                                            <div className={`text-xl font-bold ${gold ? 'text-gold-500' : 'text-gray-900'}`}>{value}/10</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest">{label}</div>
                                        </div>
                                    ))}
                                </div>
                                {latestWellbeing.notes && (
                                    <p className="text-sm italic text-gray-500 mt-2">"{latestWellbeing.notes}"</p>
                                )}
                                <p className="text-[10px] text-gray-400 mt-3">
                                    {new Date(latestWellbeing.submitted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Footy Overview ───────────────────────────────────────────────── */}
            {activeTab === 'footy' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* IDP Radar */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-xl text-gray-900 border-b-2 border-gold-400 pb-2 mb-6">
                                Skill Radar — Coach vs Self vs Squad Avg
                            </h3>
                            <div className="h-96 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={idpData}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                        <Radar name="Squad Average" dataKey="Squad" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                                        <Radar name="Player Self-Rating" dataKey="Self" stroke="#fbbf24" strokeWidth={3} fill="#fbbf24" fillOpacity={0.1} />
                                        <Radar name="Coach Rating" dataKey="Coach" stroke="#6a5a52" strokeWidth={2} fill="#6a5a52" fillOpacity={0.5} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                                <div className="absolute top-0 right-0 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-xl font-bold text-gray-900">{compositeScore}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Coach Avg</div>
                                </div>
                            </div>
                        </div>

                        {/* Match Ratings */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between border-b-2 border-gold-400 pb-2 mb-8">
                                <h3 className="font-bold text-xl text-gray-900">2026 Match Ratings</h3>
                                <div className="text-right">
                                    <span className="text-amber-500 font-bold text-lg">Avg: {matchAvg} / 5</span>
                                    <span className="text-gray-400 text-xs ml-2">({matchRatings.length} matches)</span>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartMatchData}>
                                        <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-45} textAnchor="end" height={50} />
                                        <YAxis hide domain={[0, 5]} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                        <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                        <Bar name="Match Rating" dataKey="rating" radius={[4, 4, 0, 0]} barSize={20}>
                                            {chartMatchData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.rating >= 4 ? '#10B981' : entry.rating >= 3 ? '#F59E0B' : '#EF4444'} />
                                            ))}
                                        </Bar>
                                        <Line name="3-Match Avg" type="monotone" dataKey="avg3" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#fbbf24', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Season Stats */}
                        {stats2025 && (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-xl text-gray-900 border-b-2 border-gold-400 pb-2 mb-6 flex items-center gap-2">
                                    <Trophy size={20} className="text-hfc-brown" />
                                    2025 Season Averages
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Games', value: stats2025.games_played, unit: '' },
                                        { label: 'AF Score', value: stats2025.af_avg, unit: '' },
                                        { label: 'Disposals', value: stats2025.disposals_avg, unit: '' },
                                        { label: 'Kicks', value: stats2025.kicks_avg, unit: '' },
                                        { label: 'Handballs', value: stats2025.handballs_avg, unit: '' },
                                        { label: 'Marks', value: stats2025.marks_avg, unit: '' },
                                        { label: 'Tackles', value: stats2025.tackles_avg, unit: '' },
                                        { label: 'Clearances', value: stats2025.clearances_avg, unit: '' },
                                        { label: 'Goals', value: stats2025.goals_avg, unit: '' },
                                        { label: 'Hitouts', value: stats2025.hitouts_avg, unit: '' },
                                        { label: 'Rating Pts', value: stats2025.rating_points, unit: '' },
                                    ].map(({ label, value, unit }) => (
                                        <div key={label} className="text-center bg-gray-50 rounded-xl p-3">
                                            <div className="text-xl font-bold text-hfc-brown">
                                                {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value ?? '—'}{unit}
                                            </div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Injury History */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
                                <Activity className="text-red-500" size={24} />
                                Injury History
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-400 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="pb-3 px-4">Date</th>
                                            <th className="pb-3 px-4">Injury</th>
                                            <th className="pb-3 px-4">Severity</th>
                                            <th className="pb-3 px-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {playerInjuries.map((inj, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 text-gray-500">{inj.date}</td>
                                                <td className="py-4 px-4 font-bold text-gray-900">{inj.injury_type}</td>
                                                <td className="py-4 px-4">
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                        inj.severity === 'Major' ? 'bg-red-100 text-red-700' :
                                                            inj.severity === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                                    )}>
                                                        {inj.severity}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className={clsx("w-2 h-2 rounded-full",
                                                            inj.status === 'Active' ? 'bg-red-500' : inj.status === 'Recovering' ? 'bg-amber-500' : 'bg-green-500'
                                                        )} />
                                                        <span className="text-gray-700">{inj.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {playerInjuries.length === 0 && (
                                            <tr><td colSpan={4} className="py-10 text-center text-gray-400 italic">No injury history recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* WOOP Goals */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
                            <Target className="text-hfc-brown" size={24} />
                            WOOP Goals — Wish, Outcome, Obstacle, Plan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {woopGoals.length > 0 ? woopGoals.map((goal, idx) => (
                                <div key={idx} className="p-6 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-hfc-brown text-lg">{goal.wish}</h4>
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            goal.status === 'active' ? "bg-hfc-brown text-white" : "bg-green-500 text-white"
                                        )}>
                                            {goal.status}
                                        </span>
                                    </div>
                                    <div className="grid gap-3 text-sm">
                                        <div><span className="font-black text-hfc-brown uppercase text-[10px] block mb-1">Outcome</span><p className="text-gray-700 font-medium">{goal.outcome}</p></div>
                                        <div><span className="font-black text-hfc-brown uppercase text-[10px] block mb-1">Obstacle</span><p className="text-gray-700 font-medium">{goal.obstacle}</p></div>
                                        <div><span className="font-black text-hfc-brown uppercase text-[10px] block mb-1">Plan</span><p className="text-gray-700 font-medium">{goal.plan}</p></div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-400 italic">No active WOOP goals for this period.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Fitness Performance ──────────────────────────────────────────── */}
            {activeTab === 'fitness' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                            <Activity className="text-hfc-brown" size={24} />
                            Fitness & GPS Performance
                        </h3>
                        {fitnessSession && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phase of Play:</span>
                                <select
                                    multiple
                                    value={selectedPhases}
                                    onChange={(e) => {
                                        const options = Array.from(e.target.selectedOptions, o => o.value);
                                        setSelectedPhases(options);
                                    }}
                                    className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-amber-400 min-w-[150px]"
                                >
                                    <option value="Offense">Offense</option>
                                    <option value="Defense">Defense</option>
                                    <option value="Stoppages">Stoppages</option>
                                    <option value="Bench">Bench</option>
                                    <option value="Late-Quarter">Late-Quarter</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <FitnessTab
                        session={fitnessSession}
                        pbs={fitnessPBs}
                        playerName={player.name}
                        isInjured={player.status !== 'Green'}
                    />
                </div>
            )}
        </div>
    );
};
