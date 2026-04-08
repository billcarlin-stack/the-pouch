import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { NativeRadarChart } from '../components/common/NativeRadarChart';

import { 
    Save, 
    CheckCircle, 
    MessageSquare,
    Zap,
    Target,
    Activity
} from 'lucide-react';



const SKILL_CATEGORIES = {

    "Technical": [
        "Kicking (Short 15-30m)", "Kicking (Long 50m+)", "Goal Kicking Accuracy",
        "Non-Preferred Foot Effectiveness", "Handball Execution (Traffic)",
        "Handball Vision & Creativity", "Clean Hands (Ground Level)",
        "Contested Marking", "Uncontested/Spread Marking", "Intercept Marking",
        "Lead-up Marking", "Ground Balls (Clean)", "Ground Balls (Pressure/Traffic)",
        "Tackling Technique", "Tackling Effectiveness", "Spoiling & Body Spoils",
        "Smothering Capability", "Ruck Setup / Tap Work"
    ],
    "Tactical": [
        "Offensive Positioning / Spread", "Defensive Positioning / Zone",
        "Stoppage Positioning / Setup", "Decision Making (With Ball / Under Pressure)",
        "Decision Making (Without Ball / Leading)", "Reading the Play / Anticipation",
        "Team Structure Adherence", "Game Sense / Overall Awareness",
        "Transition Running (Offense to Defense)", "Transition Running (Defense to Offense)"
    ],
    "Physical": [
        "Acceleration (First 10m)", "Top Speed Capabilities", "Agility & Lateral Movement",
        "Aerobic Endurance / Running Capacity", "Anaerobic Repeated Sprint Ability",
        "Core Strength & Stability", "Contested 1-on-1 Strength", "Vertical Jump / Leap",
        "Explosiveness out of contests", "Recovery Rate Between Efforts"
    ],
    "Mental": [
        "Resilience / Bouncing Back from Mistakes", "On-Field Leadership & Direction",
        "Off-Field Leadership & Professionalism", "Communication / Voice on Field",
        "Work Rate / Effort", "Focus & Concentration across 4 quarters",
        "Coachability & Tactical Implementation", "Aggression & Physicality",
        "Composure Under Extreme Pressure", "Self-Motivation & Drive"
    ]
};

export const PlayerReview = () => {
    const { user } = useAuth();
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [radarData, setRadarData] = useState<any[]>([]);
    const [radarSize, setRadarSize] = useState({ w: 400, h: 300 });
    const radarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchRatings = async () => {
            const jumperNo = user?.jumper_no || user?.player_id;
            if (!jumperNo) return;
            
            try {
                const data = await ApiService.getRatings(jumperNo.toString());

                if (data?.aggregated) {
                    const formatted = data.aggregated.map((r: any) => ({
                        subject: r.category,
                        Self: r.self,
                        Coach: 0, // Hidden from player
                        Squad: 0  // Hidden from player
                    }));
                    setRadarData(formatted);
                }
            } catch (err) {
                console.error("Failed to fetch player ratings", err);
            }
        };

        fetchRatings();
    }, [user, success]);

    useEffect(() => {
        const obs = new ResizeObserver(() => {
            if (radarRef.current) {
                setRadarSize({ 
                    w: radarRef.current.offsetWidth, 
                    h: Math.min(300, radarRef.current.offsetWidth * 0.75) 
                });
            }
        });
        if (radarRef.current) obs.observe(radarRef.current);
        return () => obs.disconnect();
    }, []);

    const handleRatingChange = (category: string, skill: string, value: number) => {
        setRatings(prev => ({ ...prev, [`${category}_${skill}`]: value }));
    };

    const handleNoteChange = (category: string, skill: string, value: string) => {
        setNotes(prev => ({ ...prev, [`${category}_${skill}`]: value }));
    };

    const handleSubmit = async () => {
        const jumperNo = user?.jumper_no || user?.player_id;
        if (!jumperNo) return;
        setSubmitting(true);
        try {
            const promises = [];
            for (const [key, value] of Object.entries(ratings)) {
                const [category, skill] = key.split('_');
                const note = notes[key] || '';

                promises.push(ApiService.submitRating({
                    player_id: Number(jumperNo),
                    skill_category: category,
                    skill_name: skill,
                    rating_value: value,
                    notes: note,
                    source: 'player'
                }));
            }
            
            await Promise.all(promises);
            setSuccess(true);
            setRatings({});
            setNotes({});
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Submission failed", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#1A1411] p-8 rounded-3xl shadow-sm border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">Player Review Hub</h1>
                    <p className="text-white/80 font-medium mt-1">Self-assess your performance metrics. Match the categories assessed by coaches.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl relative z-10">
                    <Target size={32} className="text-emerald-400" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rating Input Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                        <div key={category} className="bg-[#1A1411] rounded-2xl shadow-sm border border-white/10 overflow-hidden">
                            <div className="bg-[#1A1411] px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-white/80">{category}</h3>
                                <Zap size={18} className="text-gold-500" />
                            </div>
                            <div className="p-6 space-y-8">
                                {skills.map(skill => {
                                    const key = `${category}_${skill}`;
                                    const val = ratings[key] || 5;

                                    return (
                                        <div key={skill} className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="font-bold text-white/80 block">{skill}</label>
                                                <span className="text-xs font-black text-white bg-white/10 border border-white/10 px-2 py-1 rounded">
                                                    {val} / 10
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-bold text-white/40">1</span>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    step="1"
                                                    value={val}
                                                    onChange={e => handleRatingChange(category, skill, Number(e.target.value))}
                                                    className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-hfc-brown"
                                                />
                                                <span className="text-xs font-bold text-white/40">10</span>
                                            </div>

                                            <div className="relative">
                                                <MessageSquare size={14} className="absolute left-3 top-3 text-white/40" />
                                                <input
                                                    type="text"
                                                    placeholder="Self-reflection notes..."
                                                    className="w-full pl-9 pr-4 py-2 bg-white/5 text-white rounded-xl border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400/30 focus:border-gold-400/30 placeholder:text-white/20 transition-all"
                                                    value={notes[key] || ''}
                                                    onChange={e => handleNoteChange(category, skill, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Radar Preview Panel */}
                <div className="space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-hfc-brown p-6 rounded-[2.5rem] text-white border border-white/10 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-300 mb-6 flex items-center gap-2">
                                <Activity size={14} />
                                My Skill Radar
                            </h3>
                            
                            <div ref={radarRef} className="h-64 w-full flex items-center justify-center">
                                <NativeRadarChart 
                                    data={radarData} 
                                    size={radarSize} 
                                    categories={['Self']} 
                                    colors={{ Self: { stroke: '#fbbf24', fill: '#fbbf24', opacity: 0.2 } }}
                                />
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Self-Review Status</span>
                                    <span className="text-[10px] font-black text-gold-400 uppercase tracking-widest">Active</span>
                                </div>
                                <p className="text-[10px] text-white/40 leading-relaxed italic">
                                    Your personal view across technical, tactical, physical, and mental categories.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button Sidebar */}
                        <div className="bg-[#1A1411] p-6 rounded-2xl shadow-sm border border-white/10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Finalize Review</h3>
                            <p className="text-xs text-white/80 mb-6 font-medium">Click save to submit your self-assessment. Coaches will be able to compare this against their own ratings.</p>
                            
                            {success && (
                                <div className="flex items-center gap-2 text-white font-bold text-sm mb-4 animate-in fade-in slide-in-from-right-2">
                                    <CheckCircle size={18} />
                                    Ratings Saved!
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || Object.keys(ratings).length === 0}
                                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-hfc-brown text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-hfc-brown/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                            >
                                {submitting ? "Saving..." : success ? "Submitted!" : "Submit Self-Rating"}
                                <Save size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
