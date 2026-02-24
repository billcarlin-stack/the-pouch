import { useState, useEffect, useMemo } from 'react';
import type { Player, TeamPosition } from '../services/api';
import { ApiService } from '../services/api';
import {
    Users,
    Plus,
    Search,
    MessageSquare,
    X,
    ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

const BENCH = ['BENCH_1', 'BENCH_2', 'BENCH_3', 'BENCH_4', 'BENCH_5'];
const CONSID = ['CONSID_1', 'CONSID_2', 'CONSID_3', 'CONSID_4'];

const TeamBuilder = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selections, setSelections] = useState<TeamPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePos, setActivePos] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [pList, sList] = await Promise.all([
                    ApiService.getPlayers(),
                    ApiService.getTeamBuilder()
                ]);
                setPlayers(pList);
                setSelections(sList);
            } catch (error) {
                console.error('Failed to load team data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleSelectPlayer = async (positionId: string, playerId: number | null, notes: string = "") => {
        setSaving(true);
        try {
            await ApiService.updateTeamSelection(positionId, playerId, notes);
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

    // Type-safe comparison: BigQuery may return player_id as string or number
    const currentSelection = (posId: string) =>
        selections.find(s => s.position_id === posId);

    const playerAtPos = (posId: string) => {
        const sel = currentSelection(posId);
        if (sel?.player_id == null) return undefined;
        // Use == (not ===) to coerce string/number match from BigQuery
        return players.find(p => p.jumper_no == sel.player_id);
    };

    // A player is "assigned" if their jumper_no matches any selection's player_id
    const isPlayerAssigned = (jumperNo: number) =>
        selections.some(s => s.player_id != null && Number(s.player_id) === Number(jumperNo));

    const filteredPlayers = useMemo(() => {
        return players.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.jumper_no.toString().includes(searchTerm)
        );
    }, [players, searchTerm]);

    const PositionCard = ({ id, label }: { id: string; label: string }) => {
        const player = playerAtPos(id);
        const sel = currentSelection(id);
        const isEmpty = !player;

        return (
            <div
                onClick={() => setActivePos(id)}
                className={clsx(
                    "relative group cursor-pointer transition-all duration-300 h-[88px] w-[120px]",
                    "rounded-2xl border flex flex-col items-center justify-center gap-1 overflow-hidden",
                    isEmpty
                        ? "bg-white/[0.04] border-white/20 border-dashed hover:bg-white/10 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/10"
                        : "bg-gradient-to-b from-nmfc-royal/60 to-nmfc-navy/80 border-nmfc-royal/60 shadow-lg shadow-nmfc-royal/20 hover:border-yellow-400/60"
                )}
            >
                {/* Position label always at top */}
                <div className={clsx(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-2",
                    isEmpty ? "text-blue-300/70" : "text-yellow-400"
                )}>
                    {label}
                </div>

                {player ? (
                    <>
                        <div className="text-[11px] font-black text-white uppercase tracking-tight text-center px-2 leading-tight line-clamp-2">
                            {player.name}
                        </div>
                        <div className="text-[9px] font-bold text-blue-200/60">#{player.jumper_no}</div>
                        {sel?.notes && (
                            <div className="absolute top-1.5 right-1.5">
                                <MessageSquare size={9} className="text-yellow-400" />
                            </div>
                        )}
                    </>
                ) : (
                    <Plus
                        size={16}
                        className="text-blue-300/30 group-hover:text-yellow-400/70 transition-colors"
                    />
                )}

                {/* Remove button on filled cards */}
                {player && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPlayer(id, null);
                        }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400 shadow-lg z-10"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center h-64">
            <div className="text-white/40 text-sm font-bold uppercase tracking-widest animate-pulse">
                Loading Field Architecture...
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-nmfc-navy tracking-tight font-outfit uppercase">
                        Squad <span className="text-nmfc-royal">Builder</span>
                    </h1>
                    <p className="text-blue-300 font-medium mt-2 text-sm">
                        Tactical selection & match-day planning interface
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saving && (
                        <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest animate-pulse">
                            Saving...
                        </div>
                    )}
                    <div className="px-4 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                        Draft: Active
                    </div>
                </div>
            </div>

            {/* Field Map */}
            <div className="relative w-full max-w-[860px] mx-auto bg-gradient-to-b from-[#0a2a4a] via-[#0C2340] to-[#071828] rounded-[3rem] border border-white/15 shadow-2xl overflow-hidden p-10 flex flex-col items-center gap-6">
                {/* Field lines SVG overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
                    <svg width="100%" height="100%" viewBox="0 0 400 580" preserveAspectRatio="none">
                        <ellipse cx="200" cy="290" rx="185" ry="275" fill="none" stroke="white" strokeWidth="2" />
                        <circle cx="200" cy="290" r="55" fill="none" stroke="white" strokeWidth="1.5" />
                        <line x1="15" y1="290" x2="385" y2="290" stroke="white" strokeWidth="1" strokeDasharray="6 4" />
                        <rect x="150" y="15" width="100" height="70" rx="4" fill="none" stroke="white" strokeWidth="1.5" />
                        <rect x="150" y="495" width="100" height="70" rx="4" fill="none" stroke="white" strokeWidth="1.5" />
                    </svg>
                </div>

                {/* Zone label helper */}
                {(['FULL BACKS', 'HALF BACKS', 'MIDFIELD', 'HALF FORWARDS', 'FULL FORWARDS'] as const).map((zone, i) => (
                    <div key={zone} className={clsx(
                        "absolute text-[9px] font-black uppercase tracking-[0.25em] text-white/15 select-none",
                        i === 0 && "top-12 left-8",
                        i === 1 && "top-[210px] left-6",
                        i === 2 && "top-[340px] left-6",
                        i === 3 && "top-[470px] left-6",
                        i === 4 && "bottom-12 left-8",
                    )}>
                        {zone}
                    </div>
                ))}

                {/* Full Backs */}
                <div className="flex gap-3 z-10">
                    <PositionCard id="B_LEFT" label="BPL" />
                    <PositionCard id="FB" label="FB" />
                    <PositionCard id="B_RIGHT" label="BPR" />
                </div>

                {/* Half Backs */}
                <div className="flex gap-3 z-10">
                    <PositionCard id="HB_LEFT" label="HB-L" />
                    <PositionCard id="CHB" label="CHB" />
                    <PositionCard id="HB_RIGHT" label="HB-R" />
                </div>

                {/* Center / Midfield — RUCK next to C */}
                <div className="flex flex-col items-center gap-3 z-10 w-full">
                    {/* Wings + Centre row: W_LEFT | R | C | W_RIGHT */}
                    <div className="flex gap-3 items-center justify-center">
                        <PositionCard id="W_LEFT" label="WING" />
                        <PositionCard id="R" label="RUCK" />
                        <PositionCard id="C" label="C" />
                        <PositionCard id="W_RIGHT" label="WING" />
                    </div>
                    {/* Ruck Rover & Rover below */}
                    <div className="flex gap-3 justify-center">
                        <PositionCard id="RR" label="RR" />
                        <PositionCard id="ROV" label="ROV" />
                    </div>
                </div>

                {/* Half Forwards */}
                <div className="flex gap-3 z-10">
                    <PositionCard id="HF_LEFT" label="HF-L" />
                    <PositionCard id="CHF" label="CHF" />
                    <PositionCard id="HF_RIGHT" label="HF-R" />
                </div>

                {/* Full Forwards */}
                <div className="flex gap-3 z-10">
                    <PositionCard id="FP_LEFT" label="FP-L" />
                    <PositionCard id="FF" label="FF" />
                    <PositionCard id="FP_RIGHT" label="FP-R" />
                </div>
            </div>

            {/* Bench & Consideration Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Bench */}
                <div className="bg-white/[0.03] rounded-3xl border border-white/10 p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-400"></div>
                        <div className="text-[11px] font-black text-nmfc-navy uppercase tracking-[0.2em]">
                            Interchange & Bench
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {BENCH.map((id, i) => (
                            <PositionCard key={id} id={id} label={`B-${i + 1}`} />
                        ))}
                    </div>
                </div>

                {/* Consideration */}
                <div className="bg-white/[0.03] rounded-3xl border border-white/10 p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                        <div className="text-[11px] font-black text-nmfc-navy uppercase tracking-[0.2em]">
                            Extended Consideration
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {CONSID.map((id, i) => (
                            <PositionCard key={id} id={id} label={`EXT-${i + 1}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Player Selection Modal */}
            {activePos && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={() => { setActivePos(null); setSearchTerm(''); }}
                    />
                    <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0f2d50] to-[#071828] rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ChevronRight size={14} className="text-yellow-400" />
                                        <h2 className="text-lg font-black text-white uppercase font-outfit tracking-tight">
                                            {activePos.replace(/_/g, ' ')}
                                        </h2>
                                    </div>
                                    <p className="text-[10px] text-blue-300/50 font-bold uppercase tracking-widest mt-1">
                                        Select personnel for this position
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setActivePos(null); setSearchTerm(''); }}
                                    className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X size={14} className="text-white/50" />
                                </button>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/40 group-focus-within:text-yellow-400 transition-colors" size={15} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search by name or number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/15 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-blue-300/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* Player List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                            {filteredPlayers.length === 0 && (
                                <div className="text-center text-blue-300/30 text-sm py-8 font-bold uppercase tracking-widest">
                                    No players found
                                </div>
                            )}
                            {filteredPlayers.map(p => {
                                const assigned = isPlayerAssigned(p.jumper_no);
                                return (
                                    <div
                                        key={p.jumper_no}
                                        onClick={() => {
                                            if (!assigned) handleSelectPlayer(activePos, p.jumper_no);
                                        }}
                                        className={clsx(
                                            "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 group",
                                            assigned
                                                ? "bg-white/[0.02] border-white/5 opacity-35 cursor-not-allowed"
                                                : "bg-white/[0.03] border-white/8 hover:border-yellow-400/40 hover:bg-yellow-400/5 cursor-pointer"
                                        )}
                                    >
                                        <div className={clsx(
                                            "h-10 w-10 rounded-xl border flex items-center justify-center font-black text-white text-xs shrink-0",
                                            assigned ? "bg-white/5 border-white/10" : "bg-nmfc-royal/40 border-nmfc-royal/60"
                                        )}>
                                            {p.jumper_no}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={clsx(
                                                "text-sm font-black uppercase tracking-tight truncate transition-colors",
                                                assigned ? "text-white/50" : "text-white group-hover:text-yellow-400"
                                            )}>
                                                {p.name}
                                            </div>
                                            <div className="text-[10px] font-bold text-blue-300/40 uppercase tracking-wider">
                                                {p.position}
                                            </div>
                                        </div>
                                        {assigned ? (
                                            <span className="text-[9px] font-black text-yellow-400/40 uppercase tracking-widest shrink-0">
                                                Assigned
                                            </span>
                                        ) : (
                                            <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <Plus size={12} className="text-yellow-400" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-300/40 uppercase tracking-widest">
                                <Users size={11} />
                                {players.length} Players · {selections.filter(s => s.player_id != null).length} Assigned
                            </div>
                            <button
                                onClick={() => handleSelectPlayer(activePos, null)}
                                className="text-[10px] font-black text-red-400/60 uppercase tracking-widest hover:text-red-400 transition-colors"
                            >
                                Clear Position
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamBuilder;
