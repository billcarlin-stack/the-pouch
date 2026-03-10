import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Plus, Loader2, Trash2, Edit2, Search } from 'lucide-react';

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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit uppercase tracking-tight flex items-center gap-3">
                        <Shield className="text-gold-500" size={32} />
                        Access Control
                    </h1>
                    <p className="text-gray-500 mt-1">Manage system access, roles, and connected Google accounts.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-hfc-brown hover:bg-hfc-brown/90 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-black/10"
                >
                    <Plus size={20} />
                    Add Authorised Account
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-gold-400 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Error / Loading */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium border border-red-100">
                    Failed to load settings: {error}
                </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 size={40} className="animate-spin text-gold-500" />
                </div>
            ) : (
                /* Data Table */
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-4 font-bold text-gray-900 text-sm uppercase tracking-wider">Name</th>
                                    <th className="p-4 font-bold text-gray-900 text-sm uppercase tracking-wider">Google Email</th>
                                    <th className="p-4 font-bold text-gray-900 text-sm uppercase tracking-wider">Role</th>
                                    <th className="p-4 font-bold text-gray-900 text-sm uppercase tracking-wider">Jumper #</th>
                                    <th className="p-4 font-bold text-gray-900 text-sm uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 font-semibold text-gray-900">{user.name}</td>
                                        <td className="p-4 text-gray-500 font-mono text-sm">{user.google_email}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                user.role === 'coach' ? 'bg-blue-100 text-blue-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 font-mono">
                                            {user.player_id !== null ? `#${user.player_id}` : '—'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                                        <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                                            No authorized users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 font-outfit uppercase tracking-tight">
                                {editingUser ? 'Edit Authorised Account' : 'Add Authorised Account'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 text-2xl font-light">&times;</button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent font-medium"
                                    placeholder="e.g. Sam Mitchell"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Google Email Address</label>
                                <input
                                    required
                                    type="email"
                                    disabled={!!editingUser}
                                    value={formData.google_email}
                                    onChange={e => setFormData({ ...formData, google_email: e.target.value.toLowerCase() })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent font-medium disabled:opacity-50 disabled:bg-gray-100"
                                    placeholder="e.g. sam.mitchell@gmail.com"
                                />
                                {editingUser && <p className="text-xs text-gray-500 mt-1">Email cannot be changed after creation.</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Access Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent font-bold capitalize"
                                    >
                                        <option value="player">Player</option>
                                        <option value="coach">Coach</option>
                                        <option value="admin">System Admin</option>
                                    </select>
                                </div>
                                
                                {formData.role === 'player' && (
                                    <div className="animate-in slide-in-from-right-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Jumper Number</label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={formData.player_id}
                                            onChange={e => setFormData({ ...formData, player_id: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent font-mono"
                                            placeholder="e.g. 5"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 bg-hfc-brown hover:bg-hfc-brown/90 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : null}
                                    {editingUser ? 'Save Changes' : 'Grant Access'}
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
