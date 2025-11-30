import React, { useState, useEffect } from 'react';
import { X, Shield, Check, AlertCircle, Search, User, Lock, Unlock, UserPlus, Trash2 } from 'lucide-react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserPermissions } from '../types';
import { Button } from './Button';

interface SuperAdminDashboardProps {
    onClose: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onClose }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create User State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserExpiration, setNewUserExpiration] = useState<string | null>(null);
    const [creatingUser, setCreatingUser] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (userId: string, updates: Partial<UserProfile>) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
            setEditingUser(null);
        } catch (err: any) {
            console.error("Error updating profile:", err);
            alert("Failed to update profile");
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);
        try {
            // Create a temporary client to avoid logging out the admin
            const tempClient = createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false, // Don't save session to localStorage
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            const { data, error } = await tempClient.auth.signUp({
                email: newUserEmail,
                password: newUserPassword,
                options: {
                    data: {
                        expires_at: newUserExpiration
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Auto-confirm the user
                const { error: confirmError } = await supabase.rpc('confirm_user_by_admin', { user_id: data.user.id });
                if (confirmError) console.warn("Failed to auto-confirm user:", confirmError);

                alert(`User created! ID: ${data.user.id}`);
                setShowCreateModal(false);
                setNewUserEmail('');
                setNewUserPassword('');
                // Refresh list after a short delay to allow trigger to run
                setTimeout(fetchUsers, 1000);
            }
        } catch (err: any) {
            console.error("Error creating user:", err);
            alert(err.message || "Failed to create user");
        } finally {
            setCreatingUser(false);
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to delete user ${email}? This will remove their profile and access.`)) return;

        try {
            const { error } = await supabase.rpc('delete_user_by_admin', { user_id: userId });

            if (error) throw error;

            setUsers(users.filter(u => u.id !== userId));
        } catch (err: any) {
            console.error("Error deleting user:", err);
            alert(err.message || "Failed to delete user");
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <Shield className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-900">Super Admin Console</h2>
                            <p className="text-xs text-stone-500">Manage users and permissions</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                        <X size={20} className="text-stone-500" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-stone-200 flex gap-4 bg-white justify-between">
                    <div className="flex gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search users by email or store name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <Button onClick={fetchUsers} variant="secondary" className="h-auto py-2">
                            Refresh
                        </Button>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="h-auto py-2 flex items-center gap-2">
                        <UserPlus size={18} />
                        Create User
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-stone-50">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                                    <tr>
                                        <th className="p-4">User / Store</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Permissions</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-stone-200 p-2 rounded-full">
                                                        <User size={16} className="text-stone-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-stone-900">{user.store_name || 'Unnamed Store'}</div>
                                                        <div className="text-stone-500 text-xs">{user.email || 'No Email'}</div>
                                                        <div className="text-stone-400 text-[10px] font-mono mt-0.5">{user.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600'}`}>
                                                    {user.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <Badge active={user.permissions?.can_use_photo} label="Photo" />
                                                    <Badge active={user.permissions?.can_use_video} label="Video" />
                                                    <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-mono border border-blue-100">
                                                        Credits: {user.permissions?.max_credits || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="text-purple-600 hover:text-purple-800 font-medium text-xs hover:underline px-2 py-1"
                                                    >
                                                        Edit
                                                    </button>
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id, user.email || '')}
                                                            className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 border border-stone-200">
                        <h3 className="text-lg font-bold mb-4">Edit Permissions</h3>
                        <p className="text-sm text-stone-500 mb-6">
                            Managing access for <strong>{editingUser.store_name}</strong>
                        </p>

                        <div className="space-y-4">
                            <Toggle
                                label="Enable Photo Generation"
                                checked={editingUser.permissions?.can_use_photo ?? true}
                                onChange={(checked) => setEditingUser({
                                    ...editingUser,
                                    permissions: { ...editingUser.permissions, can_use_photo: checked }
                                })}
                            />
                            <Toggle
                                label="Enable Video Generation (Veo)"
                                checked={editingUser.permissions?.can_use_video ?? true}
                                onChange={(checked) => setEditingUser({
                                    ...editingUser,
                                    permissions: { ...editingUser.permissions, can_use_video: checked }
                                })}
                            />

                            <div>
                                <label className="block text-sm font-bold mb-1">Max Credits</label>
                                <input
                                    type="number"
                                    value={editingUser.permissions?.max_credits ?? 10}
                                    onChange={(e) => setEditingUser({
                                        ...editingUser,
                                        permissions: { ...editingUser.permissions, max_credits: parseInt(e.target.value) || 0 }
                                    })}
                                    className="w-full border border-stone-300 rounded-md p-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Expiration Date</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setEditingUser({ ...editingUser, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })}
                                        className="px-3 py-1 text-xs border rounded-md hover:bg-stone-50"
                                    >
                                        +24h
                                    </button>
                                    <button
                                        onClick={() => setEditingUser({ ...editingUser, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })}
                                        className="px-3 py-1 text-xs border rounded-md hover:bg-stone-50"
                                    >
                                        +30 Days
                                    </button>
                                    <button
                                        onClick={() => setEditingUser({ ...editingUser, expires_at: null })}
                                        className="px-3 py-1 text-xs border rounded-md hover:bg-stone-50"
                                    >
                                        Permanent
                                    </button>
                                </div>
                                <input
                                    type="datetime-local"
                                    value={editingUser.expires_at ? new Date(editingUser.expires_at).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, expires_at: new Date(e.target.value).toISOString() })}
                                    className="w-full border border-stone-300 rounded-md p-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
                            <Button onClick={() => handleUpdateProfile(editingUser.id, { permissions: editingUser.permissions, expires_at: editingUser.expires_at })}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 border border-stone-200">
                        <h3 className="text-lg font-bold mb-4">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className="w-full border border-stone-300 rounded-md p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Password</label>
                                <input
                                    type="password"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    className="w-full border border-stone-300 rounded-md p-2"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {/* Expiration Selection */}
                            <div>
                                <label className="block text-sm font-bold mb-1">Access Duration</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewUserExpiration(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}
                                        className="px-3 py-1 text-xs border rounded-md hover:bg-stone-50"
                                    >
                                        24 Hours
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewUserExpiration(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())}
                                        className="px-3 py-1 text-xs border rounded-md hover:bg-stone-50"
                                    >
                                        3 Days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewUserExpiration(null)}
                                        className="px-3 py-1 text-xs border rounded-md hover:bg-stone-50"
                                    >
                                        Permanent
                                    </button>
                                </div>
                                <input
                                    type="datetime-local"
                                    value={newUserExpiration ? new Date(newUserExpiration).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setNewUserExpiration(new Date(e.target.value).toISOString())}
                                    className="w-full border border-stone-300 rounded-md p-2 text-sm"
                                />
                                <p className="text-xs text-stone-500 mt-1">
                                    {newUserExpiration ? `Expires: ${new Date(newUserExpiration).toLocaleString()}` : 'No expiration (Permanent)'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button type="submit" isLoading={creatingUser}>Create User</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

const Badge = ({ active, label }: { active?: boolean, label: string }) => (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border flex items-center gap-1 ${active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
        {active ? <Check size={10} /> : <Lock size={10} />}
        {label}
    </span>
);

const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) => (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
        <span className="text-sm font-medium">{label}</span>
        <button
            onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-purple-600' : 'bg-stone-300'}`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-6' : 'left-1'}`} />
        </button>
    </div>
);
