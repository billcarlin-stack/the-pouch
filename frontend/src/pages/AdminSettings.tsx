import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Plus, Loader2, Trash2, Edit2, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface UserRole {
    id: number;
    google_email: string;
    role: 'admin' | 'coach' | 'player';
    player_id: number | null;
    name: string;
    created_at: string;
}

const AdminSettings = () => {
    const [users, setUsers] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRole | null>(null);
    const [formData, setFormData] = useState({
        google_email: '',
        name: '',
        role: 'player' as 'admin' | 'coach' | 'player',
        player_id: '' as string | number
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<UserRole[]>('/admin/users');
            setUsers(data);
            setError(null);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        
        try {
            const payload = {
                google_email: formData.google_email,
                name: formData.name,
                role: formData.role,
                player_id: formData.role === 'player' ? parseInt(formData.player_id as string) || null : null
            };

            if (editingUser) {
                await api.put(`/admin/users/${editingUser.id}`, payload);
            } else {
                await api.post('/admin/users', payload);
            }
            
            await fetchUsers();
            closeModal();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to save user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to revoke access for this user?')) return;
        
        try {
            await api.delete(`/admin/users/${id}`);
            await fetchUsers();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to delete user');
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ google_email: '', name: '', role: 'player', player_id: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserRole) => {
        setEditingUser(user);
        setFormData({
            google_email: user.google_email,
            name: user.name,
            role: user.role,
            player_id: user.player_id || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.google_email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="h-[1px] w-10 bg-gold-400/40"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">System Security</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space flex items-center gap-4">
                        <Shield className="text-gold-400" size={36} />
                        Access <span className="text-gold-400">Control</span>
                    </h1>
                    <p className="text-white/50 font-medium text-sm font-work italic">Manage system access, roles, and connected Google accounts.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-gold-500 text-[#0F0A07] px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] font-work shadow-[0_5px_15px_rgba(246,176,0,0.3)] hover:scale-105 hover:bg-white transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Authorised Account
                </button>
            </div>

            {/* Controls */}
            <div className="bg-[#1A1411] p-6 rounded-[2rem] shadow-2xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-0 bg-gold-400/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="SEARCH ACCOUNTS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-black text-[11px] text-white uppercase tracking-widest placeholder:text-white/10 font-work relative z-10"
                    />
                </div>
            </div>

            {/* Error / Loading */}
            {error && (
                <div className="bg-rose-500/10 text-rose-400 p-6 rounded-[1.5rem] border border-rose-500/20 text-center font-bold font-work relative z-10">
                    Failed to load settings: {error}
                </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center h-64 relative z-10">
                    <div className="h-10 w-10 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
                </div>
            ) : (
                /* Data Table */
                <div className="bg-[#1A1411] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden relative z-10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5">
                                    <th className="px-8 py-6 font-black text-white/20 text-[10px] uppercase tracking-[0.3em] font-space">Name</th>
                                    <th className="px-8 py-6 font-black text-white/20 text-[10px] uppercase tracking-[0.3em] font-space">Google Account</th>
                                    <th className="px-8 py-6 font-black text-white/20 text-[10px] uppercase tracking-[0.3em] font-space">Permission</th>
                                    <th className="px-8 py-6 font-black text-white/20 text-[10px] uppercase tracking-[0.3em] font-space">Identifier</th>
                                    <th className="px-8 py-6 font-black text-white/20 text-[10px] uppercase tracking-[0.3em] font-space text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6 font-black text-white text-lg font-space uppercase tracking-tight">{user.name}</td>
                                        <td className="px-8 py-6 text-white/50 font-medium italic text-sm font-work lowercase">{user.google_email}</td>
                                        <td className="px-8 py-6">
                                            <span className={clsx(
                                                "inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                user.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                user.role === 'coach' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            )}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-gold-400/60 font-black font-space">
                                            {user.player_id !== null ? `#${user.player_id}` : '—'}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-3 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-3 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                    title="Revoke Access"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center text-white/20 font-work uppercase tracking-widest text-[10px] italic">No authorized users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0A07]/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#1A1411] rounded-[2.5rem] border border-white/5 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                        
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] relative z-10">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight font-space">
                                    {editingUser ? 'Update' : 'Grant'} <span className="text-gold-400">Access</span>
                                </h2>
                                <p className="text-white/40 text-[10px] font-black font-work uppercase tracking-[0.3em] mt-1">Configure user permissions</p>
                            </div>
                            <button onClick={closeModal} className="bg-white/5 border border-white/10 p-2.5 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="p-8 space-y-6 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-bold text-white placeholder:text-white/20 text-sm font-work"
                                        placeholder="e.g. Sam Mitchell"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Google Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        disabled={!!editingUser}
                                        value={formData.google_email}
                                        onChange={e => setFormData({ ...formData, google_email: e.target.value.toLowerCase() })}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-bold text-white placeholder:text-white/20 text-sm font-work disabled:opacity-30 disabled:cursor-not-allowed"
                                        placeholder="e.g. sam.mitchell@gmail.com"
                                    />
                                    {editingUser && <p className="text-[9px] text-white/20 mt-2 font-work italic">Email cannot be changed after creation.</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Access Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-bold text-white text-sm font-work appearance-none cursor-pointer"
                                        >
                                            <option value="player" className="bg-[#1A1411]">Player</option>
                                            <option value="coach" className="bg-[#1A1411]">Coach</option>
                                            <option value="admin" className="bg-[#1A1411]">System Admin</option>
                                        </select>
                                    </div>
                                    
                                    {formData.role === 'player' && (
                                        <div className="animate-in slide-in-from-right-4">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-work mb-3 block">Jumper Number</label>
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                value={formData.player_id}
                                                onChange={e => setFormData({ ...formData, player_id: e.target.value })}
                                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 outline-none transition-all font-black text-white text-sm font-space placeholder:text-white/20"
                                                placeholder="e.g. 5"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3.5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors font-work"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-8 py-3.5 bg-gold-500 text-[#0F0A07] font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:scale-105 transition-all flex items-center gap-2 shadow-[0_5px_15px_rgba(246,176,0,0.3)] disabled:opacity-50 font-work"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {editingUser ? 'Save Changes' : 'Confirm Access'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;

