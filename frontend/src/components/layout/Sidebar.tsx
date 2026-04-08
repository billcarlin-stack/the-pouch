/*
  The Hawk Hub — Sidebar Navigation

  Persistent left-hand navigation with Hawthorn FC branding.
  Role-aware: coaches see all nav items, players only see permitted ones.
*/

import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Target, BarChart2, ClipboardList, LogOut, ClipboardCheck, Sparkles, UserCircle, Calendar, MessageSquareCode, Shield, Sword } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

import hfcLogo from '../../assets/hfc-logo.png';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            clsx(
                "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-xs relative font-work uppercase tracking-widest",
                isActive
                    ? "bg-white/10 text-white shadow-lg border border-white/5"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
            )
        }
    >
        {({ isActive }) => (
            <>
                <Icon size={16} className={clsx("transition-transform duration-500 group-hover:scale-110", isActive ? "text-gold-400" : "text-white/20 group-hover:text-white")} />
                <span className="tracking-[0.1em]">{label}</span>
                {isActive && (
                    <div className="absolute left-[-1rem] w-1.5 h-6 bg-gold-500 rounded-r-full shadow-[0_0_20px_rgba(246,176,0,0.6)]" />
                )}
            </>
        )}
    </NavLink>
);

export const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isCoach = user?.role === 'coach' || user?.role === 'admin';

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="w-64 h-screen bg-[#0F0A07] border-r border-white/5 flex flex-col text-white fixed left-0 top-0 shadow-2xl z-50">
            {/* Brand Header */}
            <div className="p-10 flex flex-col gap-6">
                <div className="h-14 w-14 premium-card !bg-hfc-brown border-gold-400/20 flex items-center justify-center shadow-gold-glow-none group group-hover:shadow-gold-glow transition-all duration-700">
                    <img src={hfcLogo} alt="HFC Logo" className="h-10 w-auto group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">The Nest</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30 font-work">Elite Hub v2.6</span>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                {isCoach && <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />}

                {/* Player-specific items */}
                {!isCoach && user?.jumper_no && (
                    <NavItem to={`/players/${user.jumper_no}`} icon={UserCircle} label="My Profile" />
                )}

                {isCoach && (
                    <NavItem to="/players" icon={Users} label="Players & Squad" />
                )}
                <NavItem to="/hawk-ai" icon={MessageSquareCode} label="Hawk AI Agent" />

                {isCoach && (
                    <NavItem to="/stats" icon={BarChart2} label="Stats Hub" />
                )}

                <NavItem to="/injuries" icon={Activity} label="Injury Log" />
                <NavItem to="/calendar" icon={Calendar} label="Squad Calendar" />

                {/* Player-only items (Hidden from coaches/admins) */}
                {user?.role === 'player' && (
                    <>
                        <NavItem to="/checkin" icon={ClipboardCheck} label="Daily Check-In" />
                        <NavItem to="/woop" icon={Sparkles} label="WOOP Goals" />
                        <NavItem to="/ratings/player-review" icon={Target} label="Player Review" />
                    </>
                )}

                {/* Coach-only items */}
                {isCoach && (
                    <>
                        <NavItem to="/match-center/previews" icon={Target} label="Opposition Previews" />
                        <NavItem to="/match-center/timeline" icon={Activity} label="Event Timeline" />
                        <NavItem to="/match-center/comparison" icon={Sword} label="Player Comparison" />
                        <NavItem to="/team-builder" icon={ClipboardList} label="Team Builder" />
                        <NavItem to="/ratings/input" icon={ClipboardCheck} label="Coach Review" />
                        <NavItem to="/ratings/compare" icon={BarChart2} label="Post Match Player Review" />
                    </>
                )}

                {/* Admin-only items */}
                {user?.is_admin && (
                    <NavItem to="/admin/settings" icon={Shield} label="Access Control" />
                )}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-6">
                <div className="flex items-center gap-3 p-4 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md group hover:bg-white/10 hover:border-white/10 transition-all duration-500">
                    <div className="h-11 w-11 rounded-full bg-hfc-brown border border-gold-400/20 text-gold-400 flex items-center justify-center font-black text-xs shadow-xl group-hover:scale-105 transition-transform duration-500">
                        {user?.initials || '??'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-white group-hover:text-gold-400 transition-colors truncate font-work uppercase tracking-wider">{user?.name || 'Guest'}</p>
                        <p className="stat-label !text-[7px] leading-none mt-1 opacity-60 uppercase">{user?.role || 'Unknown'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="text-white/20 cursor-pointer hover:text-rose-400 transition-all duration-300 p-2"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
