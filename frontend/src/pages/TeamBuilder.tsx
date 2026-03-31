import { useState, useEffect, useMemo } from 'react';
import type { Player, TeamPosition, SquadAggregates, SavedSquad } from '../services/api';
import { ApiService } from '../services/api';
import {
    Plus,
    Search,
    MessageSquare,
    X,
    Activity,
    Save,
    RotateCcw,
    Layers,
    Timer,
    Check
} from 'lucide-react';
import clsx from 'clsx';

const BENCH = ['BENCH_1', 'BENCH_2', 'BENCH_3', 'BENCH_4', 'BENCH_5'];

const ROTATION_COLORS = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Yellow', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Orange', hex: '#f97316' },
];

const TeamBuilder = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selections, setSelections] = useState<TeamPosition[]>([]);
    const [savedSquads, setSavedSquads] = useState<SavedSquad[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePos, setActivePos] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    
    // Rotation Builder State
    const [rotationMode, setRotationMode] = useState(false);
    const [selectedForRotation, setSelectedForRotation] = useState<string[]>([]);
    const [rotationColor, setRotationColor] = useState('#ef4444');
    const [rotationMinutes, setRotationMinutes] = useState(5);
    const [showRotationModal, setShowRotationModal] = useState(false);

    // Squad Save State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [newSquadName, setNewSquadName] = useState('');

    const [aggregates, setAggregates] = useState<SquadAggregates | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [pList, sList, squadList] = await Promise.all([
                    ApiService.getPlayers(),
                    ApiService.getTeamBuilder(),
                    ApiService.getSavedSquads()
                ]);
                setPlayers(pList);
                setSelections(sList);
                setSavedSquads(squadList);
            } catch (error) {
                console.error('Failed to load tactical data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const fetchAggs = async () => {
            const assignedIds = selections.filter(s => s.player_id).map(s => Number(s.player_id));
            if (assignedIds.length > 0) {
                try {
                    const data = await ApiService.getSquadAggregates(assignedIds);
                    setAggregates(data);
                } catch (e) {
                    console.error("Failed to fetch agg", e);
                }
            } else {
                setAggregates(null);
            }
        };
        fetchAggs();
    }, [selections]);

    const handleSelectPlayer = async (positionId: string, playerId: number | null, notes: string = "", rotationColor?: string, rotationMinutes?: number) => {
        setSaving(true);
        try {
            await ApiService.updateTeamSelection(positionId, playerId, notes, rotationColor, rotationMinutes);
            const newList = await ApiService.getTeamBuilder();
            setSelections(newList);
            setActivePos(null);
            setSearchTerm('');
        } catch (error) {
            console.error('Error updating selection:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateRotation = async () => {
        setSaving(true);
        try {
            const promises = selectedForRotation.map(posId => {
                const sel = selections.find(s => s.position_id === posId);
                return ApiService.updateTeamSelection(posId, sel?.player_id || null, sel?.notes || "", rotationColor, rotationMinutes);
            });
            await Promise.all(promises);
            const newList = await ApiService.getTeamBuilder();
            setSelections(newList);
            setRotationMode(false);
            setSelectedForRotation([]);
            setShowRotationModal(false);
        } catch (err) {
            console.error("Failed to create rotation", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSquad = async () => {
        if (!newSquadName.trim()) return;
        setSaving(true);
        try {
            await ApiService.saveSquad(newSquadName);
            const squadList = await ApiService.getSavedSquads();
            setSavedSquads(squadList);
            setShowSaveModal(false);
            setNewSquadName('');
        } catch (err) {
            console.error("Failed to save squad", err);
        } finally {
            setSaving(false);
        }
    };

    const handleLoadSquad = async (id: number) => {
        setSaving(true);
        try {
            await ApiService.loadSquad(id);
            const newList = await ApiService.getTeamBuilder();
            setSelections(newList);
        } catch (err) {
            console.error("Failed to load squad", err);
        } finally {
            setSaving(false);
        }
    };

    const currentSelection = (posId: string) => selections.find(s => s.position_id === posId);
    const playerAtPos = (posId: string) => {
        const sel = currentSelection(posId);
        if (sel?.player_id == null) return undefined;
        return players.find(p => p.jumper_no == sel.player_id);
    };

    const isPlayerAssigned = (jumperNo: number) =>
        selections.some(s => s.player_id != null && Number(s.player_id) === Number(jumperNo));

    const filteredPlayers = useMemo(() => {
        if (!players) return [];
        return players.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.jumper_no.toString().includes(searchTerm)
        );
    }, [players, searchTerm]);

    // Grouping notes for sidebar
    const notesList = selections.filter(s => s.notes && s.player_id);
    const rotationsGroups = useMemo(() => {
        const groups: Record<string, { color: string; mins: number; players: string[] }> = {};
        selections.forEach(s => {
            if (s.rotation_color && s.player_id) {
                const key = `${s.rotation_color}_${s.rotation_minutes}`;
                if (!groups[key]) groups[key] = { color: s.rotation_color, mins: s.rotation_minutes || 0, players: [] };
                const p = players.find(pl => pl.jumper_no == s.player_id);
                if (p) groups[key].players.push(p.name);
            }
        });
        return Object.values(groups);
    }, [selections, players]);

    const PositionCard = ({ id, label }: { id: string; label: string }) => {
        const player = playerAtPos(id);
        const sel = currentSelection(id);
        const isEmpty = !player;
        const isSelected = selectedForRotation.includes(id);

        const handleClick = () => {
            if (rotationMode) {
                if (!isEmpty) {
                    setSelectedForRotation(prev => 
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                    );
                }
            } else {
                setActivePos(id);
            }
        };

        return (
            <div
                onClick={handleClick}
                className={clsx(
                    "relative group cursor-pointer transition-all duration-300 h-[88px] w-[120px]",
                    "rounded-2xl border flex flex-col items-center justify-center gap-1 overflow-hidden",
                    isEmpty
                        ? "bg-white/[0.04] border-white/20 border-dashed hover:bg-white/10"
                        : "bg-gradient-to-b from-hfc-brown/60 to-hfc-brown/80 border-hfc-brown/60 shadow-lg",
                    isSelected && "ring-4 ring-gold-400 ring-offset-4 ring-offset-[#071828] scale-105 z-20"
                )}
            >
                {/* Rotation Tag */}
                {!isEmpty && sel?.rotation_color && (
                    <div 
                        className="absolute top-0 inset-x-0 h-1.5" 
                        style={{ backgroundColor: sel.rotation_color }}
                    />
                )}

                <div className={clsx(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-2",
                    isEmpty ? "text-amber-300/70" : "text-gold-400"
                )}>
                    {label}
                </div>

                {player ? (
                    <>
                        <div className="text-[11px] font-black text-white uppercase tracking-tight text-center px-2 leading-tight line-clamp-2">
                            {player.name}
                        </div>
                        <div className="text-[9px] font-bold text-amber-200/60 flex items-center gap-1">
                            #{player.jumper_no}
                            {sel?.rotation_minutes && (
                                <span className="flex items-center gap-0.5 text-gold-400/80">
                                    <Timer size={8} />
                                    {sel.rotation_minutes}m
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <Plus size={16} className="text-amber-300/30" />
                )}

                {player && !rotationMode && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPlayer(id, null);
                        }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center h-64">
            <div className="text-hfc-brown/40 text-sm font-black uppercase tracking-[0.3em] animate-pulse">
                Constructing Tactical Field...
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-10">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-hfc-brown tracking-tight font-outfit uppercase">
                        Tactical <span className="text-hfc-brown">Hub</span>
                    </h1>
                    <p className="text-amber-300 font-medium mt-2 text-sm uppercase tracking-widest">
                        Match-Day Selection & Rotation Strategy
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {rotationMode ? (
                        <div className="flex items-center gap-3 bg-gold-400/10 p-2 rounded-2xl border border-gold-400/30">
                            <span className="text-xs font-black text-gold-400 uppercase tracking-widest pl-2">
                                {selectedForRotation.length} Selected
                            </span>
                            <button 
                                onClick={() => setShowRotationModal(true)}
                                disabled={selectedForRotation.length === 0}
                                className="px-4 py-2 bg-gold-400 text-hfc-brown rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-50"
                            >
                                Confirm Rotation
                            </button>
                            <button 
                                onClick={() => { setRotationMode(false); setSelectedForRotation([]); }}
                                className="p-2 text-white/50 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setRotationMode(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-hfc-brown text-white rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 hover:bg-hfc-brown/80"
                        >
                            <Layers size={16} className="text-gold-400" />
                            Add Rotation
                        </button>
                    )}

                    <button 
                        onClick={() => setShowSaveModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 hover:bg-white/10"
                    >
                        <Save size={16} className="text-amber-300" />
                        Save Squad
                    </button>

                    <div className="relative group">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 hover:bg-white/10">
                            <RotateCcw size={16} className="text-amber-300" />
                            View History
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-hfc-brown border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
                            <div className="p-4 border-b border-white/5 text-[10px] font-black text-amber-300 uppercase tracking-widest">Saved Configurations</div>
                            <div className="max-h-64 overflow-y-auto">
                                {savedSquads.map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => handleLoadSquad(s.id)}
                                        className="w-full text-left px-4 py-3 hover:bg-white/5 text-xs font-bold text-white border-b border-white/5"
                                    >
                                        {s.name}
                                        <div className="text-[8px] text-white/30 uppercase mt-1">{new Date(s.created_at).toLocaleDateString()}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Field Column */}
                <div className="flex-1 space-y-8">
                    <div className="relative w-full bg-gradient-to-b from-[#0a2a4a] to-[#071828] rounded-[3rem] border border-white/15 shadow-2xl p-10 flex flex-col items-center gap-6 overflow-hidden">
                        {/* Field Svg Background */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
                            <svg width="100%" height="100%" viewBox="0 0 400 580" preserveAspectRatio="none">
                                <ellipse cx="200" cy="290" rx="185" ry="275" fill="none" stroke="white" strokeWidth="2" />
                                <circle cx="200" cy="290" r="55" fill="none" stroke="white" strokeWidth="1.5" />
                                <line x1="15" y1="290" x2="385" y2="290" stroke="white" strokeWidth="1" strokeDasharray="6 4" />
                            </svg>
                        </div>

                        {/* Position Rows */}
                        <div className="flex gap-4 z-10"><PositionCard id="B_LEFT" label="BPL" /><PositionCard id="FB" label="FB" /><PositionCard id="FB_RIGHT" label="BPR" /></div>
                        <div className="flex gap-4 z-10"><PositionCard id="HB_LEFT" label="HB-L" /><PositionCard id="CHB" label="CHB" /><PositionCard id="HB_RIGHT" label="HB-R" /></div>
                        <div className="flex flex-col items-center gap-4 z-10 w-full">
                            <div className="flex gap-4 items-center justify-center">
                                <PositionCard id="W_LEFT" label="WING" />
                                <PositionCard id="R" label="RUCK" />
                                <PositionCard id="C" label="C" />
                                <PositionCard id="W_RIGHT" label="WING" />
                            </div>
                            <div className="flex gap-4 justify-center">
                                <PositionCard id="RR" label="RR" /><PositionCard id="ROV" label="ROV" />
                            </div>
                        </div>
                        <div className="flex gap-4 z-10"><PositionCard id="HF_LEFT" label="HF-L" /><PositionCard id="CHF" label="CHF" /><PositionCard id="HF_RIGHT" label="HF-R" /></div>
                        <div className="flex gap-4 z-10"><PositionCard id="FP_LEFT" label="FP-L" /><PositionCard id="FF" label="FF" /><PositionCard id="FP_RIGHT" label="FP-R" /></div>
                    </div>

                    {/* Bench Section */}
                    <div className="bg-white/[0.03] rounded-[2rem] border border-white/10 p-6">
                        <h3 className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em] mb-4">Interchange & Bench</h3>
                        <div className="flex flex-wrap gap-4">
                            {BENCH.map((id, i) => <PositionCard key={id} id={id} label={`B-${i + 1}`} />)}
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="w-full lg:w-[380px] space-y-6">
                    {/* Active Rotations */}
                    <div className="bg-hfc-brown/40 border border-white/10 rounded-3xl overflow-hidden">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h3 className="font-black text-xs text-white uppercase tracking-widest flex items-center gap-2">
                                <Layers size={14} className="text-gold-400" />
                                Field Rotations
                            </h3>
                            <span className="text-[9px] font-bold text-amber-300/40 uppercase">{rotationsGroups.length} Active</span>
                        </div>
                        <div className="p-5 space-y-4">
                            {rotationsGroups.length === 0 ? (
                                <p className="text-xs text-white/30 italic font-medium">No rotations tagged on field.</p>
                            ) : (
                                rotationsGroups.map((rot, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rot.color }} />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Rotation Set</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-gold-400 uppercase">
                                                <Timer size={10} />
                                                {rot.mins} MINS
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                                            {rot.players.map(p => (
                                                <span key={p} className="text-[9px] font-bold text-white/60 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Field Notes Sidebar */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h3 className="font-black text-xs text-white uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={14} className="text-emerald-400" />
                                Position Notes
                            </h3>
                            <span className="text-[9px] font-bold text-amber-300/40 uppercase">{notesList.length} Notes</span>
                        </div>
                        <div className="p-5 max-h-[400px] overflow-y-auto space-y-4 custom-scrollbar">
                            {notesList.length === 0 ? (
                                <p className="text-xs text-white/30 italic font-medium">Add notes during selection to see them here.</p>
                            ) : (
                                notesList.map((sel, i) => {
                                    const p = players.find(pl => pl.jumper_no == sel.player_id);
                                    return (
                                        <div key={i} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{sel.position_id.replace('_', ' ')}</span>
                                                <span className="text-[9px] font-bold text-white/40">{p?.name}</span>
                                            </div>
                                            <p className="text-xs text-white/70 leading-relaxed bg-white/5 p-3 rounded-xl border-l-2 border-emerald-500/50">
                                                {sel.notes}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Performance Aggregates */}
                    {aggregates && (
                        <div className="bg-gradient-to-br from-gold-400/20 to-amber-600/20 border border-gold-400/30 rounded-3xl p-6">
                            <h3 className="text-[10px] font-black text-gold-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={14} />
                                Squad Projection
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-[9px] text-white/40 font-black uppercase mb-1">Metres Gained</div>
                                    <div className="text-xl font-black text-white">{aggregates.projected_metres_gained.toLocaleString()}m</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-white/40 font-black uppercase mb-1">Clearances</div>
                                    <div className="text-xl font-black text-white">{aggregates.projected_clearances}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-white/40 font-black uppercase mb-1">Avg Age</div>
                                    <div className="text-base font-bold text-white">{aggregates.average_age}y</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-white/40 font-black uppercase mb-1">Exp (Games)</div>
                                    <div className="text-base font-bold text-white">{aggregates.total_games}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals & Overlays */}
            {/* Player Selection Modal (ActivePos) */}
            {activePos && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActivePos(null)} />
                    <div className="relative w-full max-w-lg bg-[#0f2d50] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">{activePos.replace('_', ' ')} Selection</h2>
                                <button onClick={() => setActivePos(null)} className="p-2 text-white/50 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search players..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-400" 
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {filteredPlayers.map(p => (
                                <div 
                                    key={p.jumper_no}
                                    onClick={() => handleSelectPlayer(activePos, p.jumper_no, currentSelection(activePos)?.notes || '')}
                                    className={clsx(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                        isPlayerAssigned(p.jumper_no) && p.jumper_no != currentSelection(activePos)?.player_id ? "bg-white/[0.02] border-white/5 opacity-50 pointer-events-none" : "bg-white/5 border-white/5 hover:border-gold-400 hover:bg-gold-400/5 group"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-hfc-brown rounded-xl flex items-center justify-center font-black text-xs text-white border border-white/10">{p.jumper_no}</div>
                                        <div>
                                            <div className="text-sm font-black text-white uppercase group-hover:text-gold-400">{p.name}</div>
                                            <div className="text-[10px] text-white/40 font-bold uppercase">{p.position}</div>
                                        </div>
                                    </div>
                                    {isPlayerAssigned(p.jumper_no) && <Check size={16} className="text-gold-400" />}
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-white/10 flex flex-col gap-4 bg-black/20">
                            <label className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Tactical Position Notes</label>
                            <textarea 
                                placeholder="Add specific game-plan notes for this position..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white h-24 focus:outline-none focus:border-gold-400"
                                value={currentSelection(activePos)?.notes || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setSelections(prev => prev.map(s => s.position_id === activePos ? { ...s, notes: val } : s));
                                }}
                            />
                            <button 
                                onClick={() => handleSelectPlayer(activePos, currentSelection(activePos)?.player_id || null, currentSelection(activePos)?.notes || '')}
                                className="w-full py-4 bg-gold-400 text-hfc-brown rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white"
                            >
                                Save Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rotation Config Modal */}
            {showRotationModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowRotationModal(false)} />
                    <div className="relative w-full max-w-md bg-hfc-brown rounded-3xl border border-white/10 shadow-2xl p-8 space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Rotation Setup</h2>
                            <p className="text-amber-300/60 text-xs font-bold uppercase tracking-widest mt-1">Configure group parameters</p>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Select Rotation Color</label>
                            <div className="flex flex-wrap gap-3">
                                {ROTATION_COLORS.map(c => (
                                    <button 
                                        key={c.hex}
                                        onClick={() => setRotationColor(c.hex)}
                                        className={clsx(
                                            "h-10 w-10 rounded-xl border-2 transition-all",
                                            rotationColor === c.hex ? "border-gold-400 scale-110 shadow-lg" : "border-transparent opacity-60"
                                        )}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Duration (Minutes)</label>
                                <span className="text-lg font-black text-gold-400">{rotationMinutes}m</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" max="20" step="1" 
                                value={rotationMinutes} 
                                onChange={e => setRotationMinutes(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-gold-400"
                            />
                        </div>

                        <button 
                            onClick={handleCreateRotation}
                            className="w-full py-4 bg-gold-400 text-hfc-brown rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white"
                        >
                            Apply Rotation to {selectedForRotation.length} Players
                        </button>
                    </div>
                </div>
            )}

            {/* Save Squad Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSaveModal(false)} />
                    <div className="relative w-full max-w-sm bg-hfc-brown rounded-3xl border border-white/10 shadow-2xl p-8 space-y-6">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Save Configuration</h2>
                        <input 
                            type="text" 
                            placeholder="Squad Name (e.g. Round 1 vs GEE)" 
                            value={newSquadName}
                            onChange={e => setNewSquadName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-gold-400"
                        />
                        <button 
                            onClick={handleSaveSquad}
                            className="w-full py-4 bg-gold-400 text-hfc-brown rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white"
                        >
                            Save Snapshot
                        </button>
                    </div>
                </div>
            )}

            {saving && (
                <div className="fixed bottom-6 right-6 bg-hfc-brown border border-gold-400/50 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="h-2 w-2 bg-gold-400 rounded-full animate-ping" />
                    <span className="text-[10px] font-black text-gold-400 uppercase tracking-[0.2em]">Syncing Tactical Data...</span>
                </div>
            )}
        </div>
    );
};

export default TeamBuilder;
