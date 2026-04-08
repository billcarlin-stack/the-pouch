import { useState, useEffect, useMemo } from 'react';
import type { Player, TeamPosition, SquadAggregates, SavedSquad } from '../services/api';
import { ApiService, formatPlayerImage } from '../services/api';
import {
    Search,
    MessageSquare,
    X,
    Save,
    RotateCcw,
    Layers,
    Timer,
    Trash2,
    RefreshCcw,
    Edit2
} from 'lucide-react';
import clsx from 'clsx';

const BENCH = ['BENCH_1', 'BENCH_2', 'BENCH_3', 'BENCH_4', 'BENCH_5'];
const EXT_BENCH = ['EXT_1', 'EXT_2', 'EXT_3', 'EXT_4', 'EXT_5'];

const ALL_POSITIONS = [
    'B_LEFT', 'FB', 'FB_RIGHT',
    'HB_LEFT', 'CHB', 'HB_RIGHT',
    'W_LEFT', 'R', 'C', 'W_RIGHT',
    'RR', 'ROV',
    'HF_LEFT', 'CHF', 'HF_RIGHT',
    'FP_LEFT', 'FF', 'FP_RIGHT',
    ...BENCH,
    ...EXT_BENCH,
    'COACH_NOTES'
];

const ROTATION_COLORS = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Yellow', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Orange', hex: '#f97316' },
];

const readinessColor = (score?: number) => {
    if (score == null) return 'text-white/40';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-gold-400';
    return 'text-rose-400';
};

const readinessBg = (score?: number) => {
    if (score == null) return 'bg-white/10';
    if (score >= 80) return 'bg-emerald-500/20';
    if (score >= 60) return 'bg-gold-500/10';
    return 'bg-rose-500/10';
};

const TeamBuilder = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selections, setSelections] = useState<TeamPosition[]>([]);
    const [savedSquads, setSavedSquads] = useState<SavedSquad[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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

    // Drag state
    const [draggedPlayerId, setDraggedPlayerId] = useState<number | null>(null);
    const [dragOverPos, setDragOverPos] = useState<string | null>(null);

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

    const handleSelectPlayer = async (positionId: string, playerId: number | null, notes: string = "", rotColor?: string, rotMins?: number) => {
        setSaving(true);
        try {
            await ApiService.updateTeamSelection(positionId, playerId, notes, rotColor, rotMins);
            const newList = await ApiService.getTeamBuilder();
            setSelections(newList);
        } catch (error) {
            console.error('Error updating selection:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleClearTeam = async () => {
        setSaving(true);
        try {
            // Filter out COACH_NOTES so we don't wipe the general plan
            const fieldPos = ALL_POSITIONS.filter(id => id !== 'COACH_NOTES');
            await Promise.all(fieldPos.map(id => ApiService.updateTeamSelection(id, null, '')));
            const newList = await ApiService.getTeamBuilder();
            setSelections(newList);
        } catch (err) {
            console.error('Failed to clear team', err);
        } finally {
            setSaving(false);
        }
    };

    const handleClearRotations = async () => {
        setSaving(true);
        try {
            const withRotations = selections.filter(s => s.rotation_color);
            await Promise.all(withRotations.map(s =>
                ApiService.updateTeamSelection(s.position_id, s.player_id, s.notes, undefined, undefined)
            ));
            const newList = await ApiService.getTeamBuilder();
            setSelections(newList);
        } catch (err) {
            console.error('Failed to clear rotations', err);
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

    const handleEditRotation = (rot: { color: string; mins: number; players: string[] }) => {
        // Find all position IDs that have this color AND minutes
        const matchingPosIds = selections
            .filter(s => s.rotation_color === rot.color && s.rotation_minutes === rot.mins)
            .map(s => s.position_id);
            
        setRotationColor(rot.color);
        setRotationMinutes(rot.mins);
        setSelectedForRotation(matchingPosIds);
        setRotationMode(true);
        setShowRotationModal(true);
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

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, playerId: number) => {
        e.dataTransfer.setData('text/plain', playerId.toString());
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDraggedPlayerId(playerId), 0);
    };

    const handleDrop = async (e: React.DragEvent, positionId: string) => {
        e.preventDefault();
        const droppedId = e.dataTransfer.getData('text/plain');
        const playerId = droppedId ? Number(droppedId) : draggedPlayerId;
        if (playerId == null) return;
        const sel = currentSelection(positionId);
        await handleSelectPlayer(positionId, playerId, sel?.notes || '');
        setDraggedPlayerId(null);
        setDragOverPos(null);
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
            p.jumper_no.toString().includes(searchTerm) ||
            (p.position || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [players, searchTerm]);

    const notesList = selections.filter(s => s.notes && s.player_id && s.position_id !== 'COACH_NOTES');
    const coachNotes = selections.find(s => s.position_id === 'COACH_NOTES')?.notes || '';
    const [localNotes, setLocalNotes] = useState<string | undefined>(undefined);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalNotes(e.target.value);
    };

    const handleNotesBlur = () => {
        if (localNotes !== undefined && localNotes !== coachNotes) {
            handleSelectPlayer('COACH_NOTES', null, localNotes);
        }
    };

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

    /* ─── Position Card (on-field) ───────────────────────────────────── */
    const PositionCard = ({ id, label, isExtended = false }: { id: string; label: string; isExtended?: boolean }) => {
        const player = playerAtPos(id);
        const sel = currentSelection(id);
        const isEmpty = !player;
        const isSelected = selectedForRotation.includes(id);
        const isDragTarget = dragOverPos === id;

        const handleClick = () => {
            if (rotationMode && !isEmpty) {
                setSelectedForRotation(prev =>
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
            }
        };

        return (
            <div
                onClick={handleClick}
                onDragOver={(e) => { e.preventDefault(); setDragOverPos(id); }}
                onDragLeave={() => setDragOverPos(null)}
                onDrop={(e) => handleDrop(e, id)}
                className={clsx(
                    "relative group cursor-pointer transition-all duration-500 h-[92px] w-[118px]",
                    "rounded-2xl border flex flex-col items-center justify-center gap-1 overflow-hidden",
                    isEmpty && !isDragTarget
                        ? isExtended 
                            ? "bg-white/[0.03] border-white/10 border-dashed hover:bg-white/10 hover:border-gold-400/50"
                            : "bg-[#1A1411]/60 border-white/5 border-dashed hover:bg-white/10 hover:border-gold-400/50"
                        : isEmpty && isDragTarget
                        ? "bg-gold-400/20 border-gold-400 border-2 scale-105"
                        : "bg-gradient-to-b from-[#3d1c04] to-[#1A1411] border-gold-400/20 shadow-2xl",
                    isSelected && "ring-4 ring-gold-400 ring-offset-2 ring-offset-[#0F0A07] scale-105 z-20",
                    isDragTarget && !isEmpty && "ring-2 ring-gold-400"
                )}
            >
                {/* Rotation colour bar */}
                {!isEmpty && sel?.rotation_color && (
                    <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: sel.rotation_color }} />
                )}

                {/* Position label */}
                <div className={clsx(
                    "text-[8px] font-black uppercase tracking-[0.3em] px-2 font-space",
                    isEmpty ? "text-gold-400/40" : "text-gold-400"
                )}>
                    {label}
                </div>

                {player ? (
                    <>
                        <img
                            src={formatPlayerImage(player.jumper_no, player.photo_url, player.name)}
                            alt={player.name}
                            className="h-8 w-8 rounded-full object-cover border border-gold-400/30 group-hover:scale-110 transition-transform duration-500"
                            onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=4D2004&color=F6B000&size=80&length=2`; }}
                        />
                        <div className="text-[9px] font-black text-white uppercase tracking-tight text-center px-2 leading-tight line-clamp-1 font-work">
                            {player.name.split(' ').slice(-1)[0]}
                        </div>
                        <div className="flex items-center gap-1 text-[7px] font-bold font-work">
                            <span className="text-gold-400/50">#{player.jumper_no}</span>
                            {player.readiness?.score != null && (
                                <span className={clsx("font-black", readinessColor(player.readiness.score))}>
                                    {player.readiness.score}%
                                </span>
                            )}
                            {sel?.rotation_minutes && (
                                <span className="flex items-center gap-0.5 text-gold-400/80">
                                    <Timer size={7} />{sel.rotation_minutes}m
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-amber-300/25 text-[10px] font-bold uppercase tracking-widest">Drop</div>
                )}

                {/* Remove button */}
                {player && !rotationMode && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSelectPlayer(id, null); }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>
        );
    };

    /* ─── Player Pool Card ────────────────────────────────────────────── */
    const PlayerPoolCard = ({ player }: { player: Player }) => {
        const assigned = isPlayerAssigned(player.jumper_no);
        return (
            <div
                draggable={!assigned}
                onDragStart={(e) => handleDragStart(e, player.jumper_no)}
                onDragEnd={() => setDraggedPlayerId(null)}
                className={clsx(
                    "flex flex-col items-center gap-2 p-2.5 rounded-[1.5rem] border transition-all duration-500 cursor-grab active:cursor-grabbing select-none relative overflow-hidden",
                    assigned
                        ? "bg-emerald-500/5 border-emerald-500/20 opacity-40 shadow-inner"
                        : "premium-card border-white/5 hover:border-gold-400/40 hover:bg-gold-500/[0.03] hover:scale-105 hover:shadow-gold-glow-none",
                    draggedPlayerId === player.jumper_no && "opacity-20 scale-95"
                )}
            >
                <div className="relative">
                    <img
                        src={formatPlayerImage(player.jumper_no, player.photo_url, player.name)}
                        alt={player.name}
                        className="h-12 w-12 rounded-xl object-cover border-2 border-white/10"
                        onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=4D2004&color=F6B000&size=80&length=2`; }}
                    />
                    {assigned && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-[8px] text-white font-black">✓</span>
                        </div>
                    )}
                    {player.readiness?.score != null && (
                        <div className={clsx(
                            "absolute -bottom-1 -right-1 text-[8px] font-black px-1 py-0.5 rounded-md border border-white/10",
                            readinessBg(player.readiness.score),
                            readinessColor(player.readiness.score)
                        )}>
                            {player.readiness.score}
                        </div>
                    )}
                </div>
                <div className="text-center w-full">
                    <div className="text-[9px] font-black text-white uppercase tracking-tight truncate w-full text-center leading-tight">
                        {player.name.split(' ').slice(-1)[0]}
                    </div>
                    <div className="text-[8px] font-bold text-amber-300/60 uppercase truncate w-full text-center">
                        {player.position || '—'}
                    </div>
                    <div className="text-[8px] font-bold text-white/40 text-center">
                        #{player.jumper_no}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center h-64">
            <div className="text-amber-300/40 text-sm font-black uppercase tracking-[0.3em] animate-pulse">
                Constructing Tactical Field...
            </div>
        </div>
    );

    const assignedCount = selections.filter(s => s.player_id != null && s.position_id !== 'COACH_NOTES').length;

    return (
        <div className="p-6 max-w-[1700px] mx-auto space-y-6">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-10 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Tactical Builder</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                        Field <span className="text-gold-400">Strategy</span>
                    </h1>
                    <p className="text-white/40 font-medium font-work italic">
                        "Drag players from the pool onto the tactical grid."
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] font-work border border-white/10 hover:border-gold-400/40 hover:bg-gold-500/10 transition-all shadow-xl"
                    >
                        <Save size={14} className="text-gold-400" />
                        Save Squad
                    </button>

                    <button
                        onClick={handleClearTeam}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-500/5 text-rose-400 rounded-full font-black text-[10px] uppercase tracking-[0.2em] font-work border border-rose-500/20 hover:border-rose-400/60 hover:bg-rose-500/10 transition-all"
                        title="Clear all players from field"
                    >
                        <Trash2 size={14} />
                        Clear Team
                    </button>

                    <div className="relative group">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] font-work border border-white/10 hover:border-gold-400/40 hover:bg-gold-500/10 transition-all shadow-xl">
                            <RotateCcw size={14} className="text-gold-400" />
                            Load ({savedSquads.length})
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1A1411] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
                            <div className="p-4 border-b border-white/10 text-[10px] font-black text-amber-300 uppercase tracking-widest">Saved Configurations</div>
                            <div className="max-h-64 overflow-y-auto">
                                {savedSquads.length === 0 && (
                                    <div className="px-4 py-3 text-xs text-white/30 italic">No saved squads yet.</div>
                                )}
                                {savedSquads.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleLoadSquad(s.id)}
                                        className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5"
                                    >
                                        <div className="text-xs font-bold text-white">{s.name}</div>
                                        <div className="text-[8px] text-white/30 uppercase mt-0.5">{new Date(s.created_at).toLocaleDateString()}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Squad Metrics Summary Pane */}
            {aggregates && (
                <div className="premium-card flex flex-wrap items-center justify-around gap-10 py-6 px-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex flex-col gap-2">
                        <span className="stat-label !text-[8px] text-gold-400/60 uppercase tracking-[0.3em]">Projected Squad Age</span>
                        <span className="text-3xl font-black text-white font-space tracking-tighter">{aggregates.average_age} <span className="text-[10px] opacity-40 uppercase tracking-widest">Yrs</span></span>
                    </div>
                    <div className="h-10 w-px bg-white/5"></div>
                    <div className="flex flex-col gap-2">
                        <span className="stat-label !text-[8px] text-gold-400/60 uppercase tracking-[0.3em]">Match Experience</span>
                        <span className="text-3xl font-black text-white font-space tracking-tighter">{aggregates.total_games} <span className="text-[10px] opacity-40 uppercase tracking-widest">Gms</span></span>
                    </div>
                    <div className="h-10 w-px bg-white/5"></div>
                    <div className="flex-1 max-w-xs flex flex-col gap-3">
                         <span className="stat-label !text-[8px] text-gold-400/60 uppercase tracking-[0.3em]">Field Progress</span>
                         <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-gold-500 rounded-full shadow-[0_0_10px_rgba(246,176,0,0.5)] transition-all duration-1000 ease-out"
                                style={{ width: `${(assignedCount / (ALL_POSITIONS.length - 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Layout: Field + Player Pool */}
            <div className="flex flex-col xl:flex-row gap-8">

                {/* ── Field Column ─────────────────────────────────── */}
                <div className="flex-1 space-y-6 min-w-0">
                    <div className="relative w-full bg-gradient-to-b from-[#1A1411] to-[#0F0A07] rounded-[3rem] border border-white/5 shadow-2xl p-10 flex flex-col items-center gap-6 overflow-hidden">
                        {/* Pitch lines */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
                            <svg width="100%" height="100%" viewBox="0 0 400 580" preserveAspectRatio="none">
                                <ellipse cx="200" cy="290" rx="185" ry="275" fill="none" stroke="white" strokeWidth="2" />
                                <circle cx="200" cy="290" r="55" fill="none" stroke="white" strokeWidth="1.5" />
                                <line x1="15" y1="290" x2="385" y2="290" stroke="white" strokeWidth="1" strokeDasharray="6 4" />
                            </svg>
                        </div>

                        <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Defensive End</div>

                        <div className="flex gap-3 z-10"><PositionCard id="B_LEFT" label="BPL" /><PositionCard id="FB" label="FB" /><PositionCard id="FB_RIGHT" label="BPR" /></div>
                        <div className="flex gap-3 z-10"><PositionCard id="HB_LEFT" label="HB-L" /><PositionCard id="CHB" label="CHB" /><PositionCard id="HB_RIGHT" label="HB-R" /></div>
                        <div className="flex flex-col items-center gap-3 z-10 w-full">
                            <div className="flex gap-3 items-center justify-center">
                                <PositionCard id="W_LEFT" label="WING" />
                                <PositionCard id="R" label="RUCK" />
                                <PositionCard id="C" label="C" />
                                <PositionCard id="W_RIGHT" label="WING" />
                            </div>
                            <div className="flex gap-3 justify-center">
                                <PositionCard id="RR" label="RR" /><PositionCard id="ROV" label="ROV" />
                            </div>
                        </div>
                        <div className="flex gap-3 z-10"><PositionCard id="HF_LEFT" label="HF-L" /><PositionCard id="CHF" label="CHF" /><PositionCard id="HF_RIGHT" label="HF-R" /></div>
                        <div className="flex gap-3 z-10"><PositionCard id="FP_LEFT" label="FP-L" /><PositionCard id="FF" label="FF" /><PositionCard id="FP_RIGHT" label="FP-R" /></div>

                        <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Attacking End</div>
                    </div>

                    {/* Extended Bench Components */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-[#1A1411] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-400/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                            <h3 className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] font-space mb-6">Interchange & Bench</h3>
                            <div className="flex flex-wrap gap-4">
                                {BENCH.map((id, i) => <PositionCard key={id} id={id} label={`B-${i + 1}`} />)}
                            </div>
                        </div>
                        <div className="bg-[#1A1411]/40 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-400/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                            <h3 className="text-[10px] font-black text-gold-400/40 uppercase tracking-[0.3em] font-space mb-6">Extended Consideration</h3>
                            <div className="flex flex-wrap gap-4">
                                {EXT_BENCH.map((id) => <PositionCard key={id} id={id} label={`E-${id.split('_')[1]}`} isExtended />)}
                            </div>
                        </div>
                    </div>

                    {/* General Coach Notes Box */}
                    <div className="premium-card p-10 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <MessageSquare size={18} className="text-emerald-400" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] font-space">Strategic Directives</h3>
                        </div>
                        <textarea
                            placeholder="Synthesize tactical imperatives, matchups, and critical late adjustments..."
                            value={localNotes !== undefined ? localNotes : coachNotes}
                            onChange={handleNotesChange}
                            onBlur={handleNotesBlur}
                            className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 transition-all custom-scrollbar font-work italic leading-relaxed"
                        />
                    </div>
                </div>

                {/* ── Right Panel ─────────────────────────────────── */}
                <div className="xl:w-[460px] flex flex-col gap-8">

                    {/* Rotation Controls & Pane */}
                    <div className="bg-[#1A1411] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="p-8 border-b border-white/5 bg-gold-400/[0.02] relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-black text-[10px] text-white uppercase tracking-[0.4em] flex items-center gap-3 font-space">
                                    <div className="p-2 bg-white/5 rounded-xl text-gold-400">
                                        <Layers size={14} />
                                    </div>
                                    Dynamic Rotations
                                </h3>
                                <span className="stat-label !text-[8px] opacity-40 uppercase tracking-[0.2em]">{rotationsGroups.length} Active Modules</span>
                            </div>
                            <div className="flex gap-4">
                                {rotationMode ? (
                                    <div className="flex-1 flex items-center gap-3 bg-gold-400/5 p-3 rounded-2xl border border-gold-400/20">
                                        <span className="text-[10px] font-black text-gold-400 uppercase tracking-[0.2em] pl-2 flex-1 font-space">
                                            {selectedForRotation.length} Entities Selected
                                        </span>
                                        <button
                                            onClick={() => setShowRotationModal(true)}
                                            className="px-6 py-2.5 bg-gold-500 text-[#0F0A07] rounded-full text-[9px] font-black uppercase tracking-[0.2em] font-work shadow-xl"
                                        >
                                            Configure
                                        </button>
                                        <button onClick={() => { setRotationMode(false); setSelectedForRotation([]); }} className="p-2 text-white/20 hover:text-white transition-colors"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setRotationMode(true)}
                                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gold-500 text-[#0F0A07] rounded-full font-black text-[10px] uppercase tracking-[0.2em] font-work hover:bg-white transition-all shadow-xl shadow-gold-500/10"
                                    >
                                        <Layers size={16} />
                                        Initialize Rotation
                                    </button>
                                )}
                                <button
                                    onClick={handleClearRotations}
                                    className="p-4 bg-white/5 text-rose-400 rounded-full border border-white/10 hover:bg-rose-500/10 transition-all"
                                    title="Reset Rotations"
                                >
                                    <RefreshCcw size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar relative z-10">
                            {rotationsGroups.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-[10px] text-white/10 italic uppercase tracking-widest font-work">Awaiting module definition...</p>
                                </div>
                            ) : (
                                rotationsGroups.map((rot, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 space-y-4 group hover:border-gold-400/30 transition-all duration-500 shadow-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: rot.color, backgroundColor: rot.color }} />
                                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-space group-hover:text-gold-400 transition-colors">Tactical Module</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gold-400 uppercase tracking-widest font-work">
                                                    <Timer size={10} />{rot.mins}m
                                                </div>
                                                <button 
                                                    onClick={() => handleEditRotation(rot)}
                                                    className="p-2 bg-white/5 text-white/20 rounded-xl hover:text-white transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                            {rot.players.map(p => (
                                                <span key={p} className="text-[9px] font-black text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 font-work uppercase group-hover:text-white transition-colors">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Player Pool (Condensed to fit sidebar) */}
                    <div className="bg-[#1A1411] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col flex-1 shadow-2xl" style={{ maxHeight: '700px' }}>
                        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] font-space">Player Registry</h3>
                                <span className="stat-label !text-[8px] opacity-40 uppercase tracking-[0.2em]">
                                    {players.filter(p => !isPlayerAssigned(p.jumper_no)).length} Available
                                </span>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gold-400/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-400 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search registry..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-gold-400/50 transition-all font-work relative z-10"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                {filteredPlayers.map(p => (
                                    <PlayerPoolCard key={p.jumper_no} player={p} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Position Notes */}
                    {notesList.length > 0 && (
                        <div className="bg-[#1A1411] border border-white/5 rounded-[2.5rem] overflow-hidden max-h-[350px] shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="font-black text-[10px] text-white uppercase tracking-[0.4em] flex items-center gap-3 font-space">
                                    <div className="p-2 bg-white/5 rounded-xl text-emerald-400 font-work">
                                        <MessageSquare size={14} />
                                    </div>
                                    Tactical Annotations
                                </h3>
                                <span className="stat-label !text-[8px] opacity-40 uppercase tracking-[0.2em]">{notesList.length} Active</span>
                            </div>
                            <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                                {notesList.map((sel, i) => {
                                    const p = players.find(pl => pl.jumper_no == sel.player_id);
                                    return (
                                        <div key={i} className="space-y-3 group">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-gold-400/60 uppercase tracking-[0.3em] font-space group-hover:text-gold-400 transition-colors">{sel.position_id.replace(/_/g, ' ')}</span>
                                                <span className="text-[9px] font-black text-white/40 font-work uppercase">{p?.name.split(' ').slice(-1)[0]}</span>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed bg-white/5 p-5 rounded-2xl border-l-[3px] border-emerald-500 font-work italic group-hover:text-white transition-colors">
                                                "{sel.notes}"
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Rotation Config Modal ───────────────────────── */}
            {showRotationModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[#0F0A07]/90 backdrop-blur-xl" onClick={() => setShowRotationModal(false)} />
                    <div className="relative w-full max-w-md bg-[#1A1411] rounded-[2.5rem] border border-white/5 shadow-[0_0_100px_-20px_rgba(246,176,0,0.2)] p-10 space-y-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight font-space">Initialize Module</h2>
                            <p className="stat-label !text-[8px] opacity-40 uppercase tracking-[0.4em]">Configure strategic deployment parameters</p>
                        </div>
                        <div className="space-y-6">
                            <label className="stat-label !text-[9px] text-gold-400/60 uppercase tracking-[0.3em]">Module Identifier Color</label>
                            <div className="grid grid-cols-6 gap-4">
                                {ROTATION_COLORS.map(c => (
                                    <button
                                        key={c.hex}
                                        onClick={() => setRotationColor(c.hex)}
                                        className={clsx("h-12 rounded-2xl border-2 transition-all duration-500 shadow-xl", rotationColor === c.hex ? "border-gold-500 scale-110 shadow-gold-glow" : "border-transparent opacity-20 hover:opacity-100")}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <label className="stat-label !text-[9px] text-gold-400/60 uppercase tracking-[0.3em]">Operational Interval</label>
                                <span className="text-3xl font-black text-white font-space tracking-tight">{rotationMinutes}<span className="text-[10px] opacity-40 mb-1 ml-1 uppercase">Mins</span></span>
                            </div>
                            <input
                                type="range" min="1" max="60" step="1"
                                value={rotationMinutes}
                                onChange={e => setRotationMinutes(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-gold-500 cursor-pointer border border-white/5"
                            />
                        </div>
                        <button
                            onClick={handleCreateRotation}
                            className="w-full py-5 bg-gold-500 text-[#0F0A07] rounded-full font-black text-[10px] uppercase tracking-[0.4em] font-work hover:bg-white transition-all shadow-xl shadow-gold-500/20"
                        >
                            Commit Module to {selectedForRotation.length} Entities
                        </button>
                    </div>
                </div>
            )}

            {/* ── Save Squad Modal ─────────────────────────────── */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[#0F0A07]/90 backdrop-blur-xl" onClick={() => setShowSaveModal(false)} />
                    <div className="relative w-full max-w-md bg-[#1A1411] rounded-[2.5rem] border border-white/5 shadow-2xl p-10 space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight font-space text-center">Capture Snapshot</h2>
                            <p className="stat-label !text-[8px] opacity-40 uppercase tracking-[0.4em] text-center">Archive current tactical configuration</p>
                        </div>
                        <input
                            type="text"
                            placeholder="Designation (e.g. Round 15 vs SYD)"
                            value={newSquadName}
                            onChange={e => setNewSquadName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveSquad()}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-8 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-gold-400/50 transition-all font-work italic text-center"
                        />
                        <button
                            onClick={handleSaveSquad}
                            className="w-full py-5 bg-gold-500 text-[#0F0A07] rounded-full font-black text-[10px] uppercase tracking-[0.4em] font-work hover:bg-white transition-all shadow-xl shadow-gold-500/10"
                        >
                            Confirm Archival
                        </button>
                    </div>
                </div>
            )}

            {/* ── Saving Indicator ─────────────────────────────── */}
            {saving && (
                <div className="fixed bottom-6 right-6 bg-[#0d2444] border border-amber-400/40 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3">
                    <div className="h-2 w-2 bg-amber-400 rounded-full animate-ping" />
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Syncing Team State...</span>
                </div>
            )}
        </div>
    );
};

export default TeamBuilder;
