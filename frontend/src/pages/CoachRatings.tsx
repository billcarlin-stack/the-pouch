/*
  The Nest — Coach Ratings Module
  
  Module 2: Survey interface for coaches to rate players on specific skills.
*/

import { useEffect, useState } from 'react';
import { ApiService, formatPlayerImage } from '../services/api';
import type { Player } from '../services/api';
import { Save, User } from 'lucide-react';

const SKILL_CATEGORIES = {
    "Technical": ["Kicking", "Handball", "Marking", "Tackling"],
    "Tactical": ["Decision Making", "Positioning", "Stoppage Craft"],
    "Physical": ["Speed", "Endurance", "Strength"],
    "Mental": ["Resilience", "Leadership", "Professionalism"]
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
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Coach Development Ratings</h1>
                    <p className="text-gray-500">Assess player skills on a 1-10 scale.</p>
                </div>

                {/* Player Selector */}
                <div className="w-full md:w-72">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Select Player</label>
                    <div className="relative">
                        <select
                            className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-hfc-brown focus:outline-none font-medium shadow-sm"
                            value={selectedPlayerId}
                            onChange={e => setSelectedPlayerId(Number(e.target.value))}
                        >
                            <option value={0}>Choose a player...</option>
                            {players.map(p => (
                                <option key={p.jumper_no} value={p.jumper_no}>#{p.jumper_no} {p.name}</option>
                            ))}
                        </select>
                        <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>
                </div>
            </div>

            {selectedPlayer && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full border-2 border-hfc-brown p-1">
                        <img
                            src={formatPlayerImage(selectedPlayer.jumper_no, selectedPlayer.photo_url)}
                            alt={selectedPlayer.name}
                            className="w-full h-full object-cover rounded-full bg-gray-100"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedPlayer.name} #{selectedPlayer.jumper_no}</h2>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">{selectedPlayer.position}</span>
                            <span>{selectedPlayer.age} years old</span>
                            <span>{selectedPlayer.games} games</span>
                        </div>
                    </div>
                </div>
            )}

            {selectedPlayerId !== 0 && (
                <div className="space-y-8 pb-20">
                    {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                        <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-lg text-gray-800">{category}</h3>
                            </div>
                            <div className="p-6 space-y-8">
                                {skills.map(skill => {
                                    const key = `${category}_${skill}`;
                                    const val = ratings[key] || 5; // Default middle

                                    return (
                                        <div key={skill} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                            <div className="md:col-span-3">
                                                <label className="font-medium text-gray-900 block">{skill}</label>
                                            </div>

                                            <div className="md:col-span-5 flex items-center gap-4">
                                                <span className="text-xs font-bold text-gray-400">1</span>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    step="1"
                                                    value={val}
                                                    onChange={e => handleRatingChange(category, skill, Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-hfc-brown"
                                                />
                                                <span className="text-xs font-bold text-gray-400">10</span>
                                                <div className="w-12 h-10 flex items-center justify-center bg-hfc-brown text-white font-bold rounded-lg shadow-sm border border-amber-800">
                                                    {val}
                                                </div>
                                            </div>

                                            <div className="md:col-span-4">
                                                <input
                                                    type="text"
                                                    placeholder="Optional notes..."
                                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-hfc-brown focus:outline-none"
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

                    <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-gray-200 flex justify-end gap-4 z-40">
                        <button
                            onClick={handleSubmit}
                            className="bg-hfc-brown text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-900 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Save size={20} />
                            Save All Ratings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
