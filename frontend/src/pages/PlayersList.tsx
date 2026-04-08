/*
  The Nest — Players List Page

  Displays grid of player cards with readiness status.
  Includes search filtering and navigation to detail view.
*/

import { useEffect, useState } from 'react';
import { ApiService, formatPlayerImage } from '../services/api';
import type { Player } from '../services/api';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const PlayerCard = ({ player }: { player: Player }) => {
    const statusGlow = {
        Green: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] border-emerald-500/20',
        Amber: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] border-gold-500/20',
        Red: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] border-rose-500/20',
    };

    const statusBadge = {
        Green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        Amber: 'bg-gold-500/10 text-gold-400 border-gold-500/20',
        Red: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    return (
        <Link
            to={`/players/${player.jumper_no}`}
            className={clsx(
                "group premium-card p-6 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 relative overflow-hidden",
                statusGlow[player.status]
            )}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>
            
            {/* Status Badge */}
            <div className={clsx(
                "absolute top-4 right-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border backdrop-blur-md z-10 font-work",
                statusBadge[player.status]
            )}>
                {player.status}
            </div>

            {/* Jumper Badge */}
            <div className="absolute top-4 left-4 w-7 h-7 rounded-xl bg-hfc-brown border border-gold-400/20 text-gold-400 flex items-center justify-center text-[10px] font-black font-space shadow-lg z-10 group-hover:scale-110 transition-transform duration-500">
                {player.jumper_no}
            </div>

            {/* Image */}
            <div className="relative mt-2 mb-6">
                <div className={clsx(
                    "absolute inset-0 rounded-full blur-[20px] opacity-0 group-hover:opacity-40 transition-opacity duration-700",
                    player.status === 'Green' ? 'bg-emerald-500' : player.status === 'Amber' ? 'bg-gold-500' : 'bg-rose-500'
                )} />
                <div className="w-28 h-28 rounded-full border-2 border-white/5 p-1 bg-[#1A1411] shadow-2xl relative z-10 overflow-hidden">
                    <img
                        src={formatPlayerImage(player.jumper_no, player.photo_url, player.name)}
                        alt={player.name}
                        className="w-full h-full object-cover rounded-full grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=4D2004&color=F6B000&size=200&length=2&font-size=0.4`;
                        }}
                    />
                </div>
            </div>

            {/* Info */}
            <h3 className="font-black text-white text-xl leading-tight mb-2 font-space uppercase tracking-tight group-hover:text-gold-400 transition-colors">{player.name}</h3>
            <p className="stat-label !text-[8px] opacity-40 uppercase tracking-[0.3em] font-work mb-6">/ {player.position}</p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 w-full pt-6 border-t border-white/5 relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-white font-space">{player.age}</span>
                    <span className="stat-label !text-[7px] uppercase opacity-30">YRS</span>
                </div>
                <div className="flex flex-col gap-1 border-x border-white/5">
                    <span className="text-sm font-black text-white font-space">{player.games}</span>
                    <span className="stat-label !text-[7px] uppercase opacity-30">GMS</span>
                </div>
                {player.readiness && (
                    <div className="flex flex-col gap-1">
                        <span className={clsx(
                            "text-sm font-black font-space",
                            player.readiness.score > 8 ? 'text-emerald-400' : 'text-gold-400'
                        )}>
                            {player.readiness.score.toFixed(1)}
                        </span>
                        <span className="stat-label !text-[7px] uppercase opacity-30">RDY</span>
                    </div>
                )}
            </div>
        </Link>
    );
};

export const PlayersList = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ApiService.getPlayers()
            .then(setPlayers)
            .finally(() => setLoading(false));
    }, []);

    const filtered = players.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.jumper_no.toString().includes(search)
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-10 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Playing List</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">The Squad</h1>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-gold-400/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Filter by name or jumper..."
                        className="pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-[2rem] w-full md:w-80 focus:ring-1 focus:ring-gold-400 focus:border-transparent outline-none shadow-2xl backdrop-blur-md text-white font-work placeholder:text-white/10 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {loading ? (
                    // Skeleton Loader
                    [...Array(8)].map((_, i) => (
                        <div key={i} className="premium-card p-8 flex flex-col items-center animate-pulse">
                            <div className="w-28 h-28 rounded-full bg-white/5 mb-6"></div>
                            <div className="h-6 bg-white/5 w-40 rounded-full mb-3"></div>
                            <div className="h-2 bg-white/5 w-24 rounded-full mb-8"></div>
                            <div className="h-10 bg-white/5 w-full rounded-[1.5rem]"></div>
                        </div>
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map(player => (
                        <PlayerCard key={player.jumper_no} player={player} />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center text-white/40">
                        No players found matching "{search}"
                    </div>
                )}
            </div>
        </div>
    );
};
