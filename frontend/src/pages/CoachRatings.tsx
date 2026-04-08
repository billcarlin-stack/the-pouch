/*
  The Nest — Coach Ratings Module
  
  Module 2: Survey interface for coaches to rate players on specific skills.
*/

import { useEffect, useState } from 'react';
import { ApiService, formatPlayerImage } from '../services/api';
import type { Player } from '../services/api';
import { Save, User } from 'lucide-react';

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

export const CoachRatings = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ApiService.getPlayers().then(setPlayers).finally(() => setLoading(false));
    }, []);

    const handleRatingChange = (category: string, skill: string, value: number) => {
        setRatings(prev => ({ ...prev, [`${category}_${skill}`]: value }));
    };

    const handleNoteChange = (category: string, skill: string, value: string) => {
        setNotes(prev => ({ ...prev, [`${category}_${skill}`]: value }));
    };

    const handleSubmit = async () => {
        if (!selectedPlayerId) return alert("Select a player first.");

        // Prepare bulk submission (or sequential)
        // For MVP, we'll just log to console or send one by one. 
        // Ideally backend accepts bulk, but `submitRating` is single.
        // We'll just loop and submit for now (inefficient but works for MVP).

        const promises = [];
        for (const [key, value] of Object.entries(ratings)) {
            const [category, skill] = key.split('_');
            const note = notes[key] || '';

            promises.push(ApiService.submitRating({
                player_id: selectedPlayerId,
                skill_category: category,
                skill_name: skill,
                rating_value: value,
                notes: note
            }));
        }

        try {
            await Promise.all(promises);
            alert("Ratings saved successfully!");
            setRatings({});
            setNotes({});
        } catch (err) {
            console.error(err);
            alert("Error saving ratings.");
        }
    };

    const selectedPlayer = players.find(p => p.jumper_no === selectedPlayerId);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700 max-w-[1200px] mx-auto p-8 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-10 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Elite Development</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                        Coach <span className="text-gold-400">Ratings</span>
                    </h1>
                    <p className="text-white/50 text-sm font-medium font-work italic">Assess player tactical & technical skills on a 1-10 elite scale.</p>
                </div>

                {/* Player Selector */}
                <div className="w-full md:w-80 group">
                    <label className="block text-[10px] font-black text-gold-400/60 uppercase tracking-[0.3em] font-work mb-3">Select Player</label>
                    <div className="relative">
                        <select
                            className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl appearance-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 focus:outline-none font-medium shadow-lg text-white font-work transition-all group-hover:border-white/20"
                            value={selectedPlayerId}
                            onChange={e => setSelectedPlayerId(Number(e.target.value))}
                        >
                            <option value={0} className="bg-[#1A1411]">Choose an athlete...</option>
                            {players.map(p => (
                                <option key={p.jumper_no} value={p.jumper_no} className="bg-[#1A1411]">#{p.jumper_no} {p.name}</option>
                            ))}
                        </select>
                        <User className="absolute left-4 top-[1.125rem] text-white/30 group-focus-within:text-gold-400 transition-colors" size={20} />
                    </div>
                </div>
            </div>

            {selectedPlayer && (
                <div className="bg-[#1A1411] p-8 rounded-[2rem] shadow-2xl border border-white/5 flex items-center gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                    <div className="w-24 h-24 rounded-full border-4 border-[#0F0A07] shadow-[0_0_20px_rgba(246,176,0,0.15)] relative z-10 shrink-0 overflow-hidden">
                        <img
                            src={formatPlayerImage(selectedPlayer?.jumper_no, selectedPlayer?.photo_url)}
                            alt={selectedPlayer?.name}
                            className="w-full h-full object-cover bg-[#0F0A07] grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                        />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-white font-space tracking-tight uppercase leading-none">{selectedPlayer?.name} <span className="text-gold-400">#{selectedPlayer?.jumper_no}</span></h2>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.1em] font-work mt-3">
                            <span className="bg-gold-500/10 text-gold-400 px-3 py-1 rounded-full border border-gold-400/20">{selectedPlayer?.position}</span>
                            <span className="text-white/40">{selectedPlayer?.age} YRS</span>
                            <span className="text-white/20">•</span>
                            <span className="text-white/40">{selectedPlayer?.games} GMS</span>
                        </div>
                    </div>
                </div>
            )}

            {selectedPlayerId !== 0 && (
                <div className="space-y-10 pb-24 relative">
                    {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                        <div key={category} className="bg-[#1A1411] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden group">
                            <div className="bg-white/[0.02] px-8 py-6 border-b border-white/5 flex items-center gap-4">
                                <h3 className="font-black text-2xl text-white font-space uppercase tracking-tight">{category}</h3>
                                <span className="h-[1px] flex-1 bg-white/5"></span>
                            </div>
                            <div className="p-8 space-y-10">
                                {skills.map(skill => {
                                    const key = `${category}_${skill}`;
                                    const val = ratings[key] || 5; // Default middle

                                    return (
                                        <div key={skill} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center group/row">
                                            <div className="md:col-span-4">
                                                <label className="font-bold text-white/90 text-sm font-work uppercase tracking-wide group-hover/row:text-gold-400 transition-colors block">{skill}</label>
                                            </div>

                                            <div className="md:col-span-5 flex items-center gap-5">
                                                <span className="text-[10px] font-black font-space text-white/30">1</span>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    step="1"
                                                    value={val}
                                                    onChange={e => handleRatingChange(category, skill, Number(e.target.value))}
                                                    className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-gold-400 hover:bg-white/20 transition-colors"
                                                />
                                                <span className="text-[10px] font-black font-space text-white/30">10</span>
                                                <div className="w-14 h-12 flex items-center justify-center bg-gold-400/10 text-gold-400 font-black text-xl rounded-xl shadow-lg border border-gold-400/30 font-space shadow-gold-500/10 shrink-0">
                                                    {val}
                                                </div>
                                            </div>

                                            <div className="md:col-span-3">
                                                <input
                                                    type="text"
                                                    placeholder="Optional notations..."
                                                    className="w-full p-3 text-sm bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 focus:outline-none text-white font-work italic placeholder:text-white/20 transition-all text-[11px]"
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

                    <div className="fixed bottom-0 left-64 right-0 p-6 bg-[#0F0A07]/90 backdrop-blur-xl border-t border-white/5 flex justify-end gap-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <button
                            onClick={handleSubmit}
                            className="bg-gold-500 text-[#0F0A07] px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.2em] font-work hover:bg-white transition-all flex items-center gap-3 shadow-[0_10px_30px_-5px_rgba(246,176,0,0.4)]"
                        >
                            <Save size={18} />
                            Commit Development Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
