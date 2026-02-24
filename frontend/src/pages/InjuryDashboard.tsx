/*
  The Pouch — Injury & Load Log Dashboard
  
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

    if (loading) return <div className="p-10 text-center text-gray-500">Loading module...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Injury & Load Log</h1>
                <p className="text-gray-500">Manage injury records and update player availability status.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
                    <div>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <div className="text-xs text-gray-500 uppercase font-medium">Active Injuries</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><Clock size={24} /></div>
                    <div>
                        <div className="text-2xl font-bold">{recoveringCount}</div>
                        <div className="text-xs text-gray-500 uppercase font-medium">Recovering</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
                    <div>
                        <div className="text-2xl font-bold">{clearedCount}</div>
                        <div className="text-xs text-gray-500 uppercase font-medium">Cleared</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Activity size={24} /></div>
                    <div>
                        <div className="text-2xl font-bold">{totalCount}</div>
                        <div className="text-xs text-gray-500 uppercase font-medium">Total Records</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Log Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900">Recent Logs</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Player</th>
                                    <th className="px-6 py-3">Injury</th>
                                    <th className="px-6 py-3">Severity</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {injuries.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">{log.date}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{log.player_name}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{log.injury_type}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                                log.severity === 'Major' ? 'bg-red-100 text-red-700' :
                                                    log.severity === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-green-100 text-green-700'
                                            )}>
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={clsx(
                                                    "w-2 h-2 rounded-full",
                                                    log.status === 'Active' ? 'bg-red-500' :
                                                        log.status === 'Recovering' ? 'bg-amber-500' :
                                                            'bg-green-500'
                                                )}></div>
                                                {log.status}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {injuries.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No injury records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Entry Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <Plus size={20} className="text-nmfc-royal" />
                        Log New Entry
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
                            <select
                                className={clsx(
                                    "w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nmfc-royal focus:outline-none",
                                    user?.role === 'player' && "bg-gray-50 text-gray-400 cursor-not-allowed"
                                )}
                                value={formData.player_id}
                                onChange={e => setFormData({ ...formData, player_id: Number(e.target.value) })}
                                required
                                disabled={user?.role === 'player'}
                            >
                                <option value={0}>Select Player...</option>
                                {players.map(p => (
                                    <option key={p.jumper_no} value={p.jumper_no}>#{p.jumper_no} {p.name}</option>
                                ))}
                            </select>
                            {user?.role === 'player' && (
                                <p className="text-[10px] text-gray-400 mt-1 italic">Players can only log entries for their own records.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Injury Type</label>
                            <input
                                type="text"
                                placeholder="e.g. Hamstring"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nmfc-royal focus:outline-none"
                                value={formData.injury_type}
                                onChange={e => setFormData({ ...formData, injury_type: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Body Area</label>
                            <select
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nmfc-royal focus:outline-none"
                                value={formData.body_area}
                                onChange={e => setFormData({ ...formData, body_area: e.target.value })}
                                required
                            >
                                <option value="">Select Area...</option>
                                <option value="Head/Neck">Head/Neck</option>
                                <option value="Shoulder">Shoulder</option>
                                <option value="Upper Arm">Upper Arm</option>
                                <option value="Elbow">Elbow</option>
                                <option value="Forearm">Forearm</option>
                                <option value="Hand/Wrist">Hand/Wrist</option>
                                <option value="Back/Spine">Back/Spine</option>
                                <option value="Chest/Abdo">Chest/Abdo</option>
                                <option value="Hip/Groin">Hip/Groin</option>
                                <option value="Thigh">Thigh</option>
                                <option value="Knee">Knee</option>
                                <option value="Lower Leg">Lower Leg</option>
                                <option value="Ankle">Ankle</option>
                                <option value="Foot/Toes">Foot/Toes</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                            <select
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nmfc-royal focus:outline-none"
                                value={formData.severity}
                                onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
                            >
                                <option value="Minor">Minor</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Major">Major</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                            <select
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nmfc-royal focus:outline-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="Active">Active Injury (Unavailable)</option>
                                <option value="Recovering">Recovering (Modified)</option>
                                <option value="Cleared">Cleared (Full Training)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nmfc-royal focus:outline-none h-24"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-nmfc-royal text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Log Entry & Update Status
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
