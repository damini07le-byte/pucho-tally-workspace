import React, { useState } from 'react';
import { useAccountFlow } from '../context/AccountFlowContext';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Users, Building, AlertCircle, Save, Plus, Trash2, User, ShieldCheck, History } from 'lucide-react';

const Settings = () => {
    const { companySettings, setCompanySettings, teamMembers, setTeamMembers, auditLogs } = useAccountFlow();
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('general'); // general, team, rules, profile, logs
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Staff' });
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || 'Strategic Accountant'
    });
    const [automationRules, setAutomationRules] = useState({
        autoImport: true,
        syncMasters: true,
        autoApproveLimit: 5000
    });
    const [saveStatus, setSaveStatus] = useState(null);
    const [expandedLog, setExpandedLog] = useState(null);

    // Handlers
    const handleCompanyUpdate = (field, value) => {
        setCompanySettings(prev => ({ ...prev, [field]: value }));
    };

    const handleInvite = () => {
        if (!newMember.name || !newMember.email) return;
        setTeamMembers(prev => [
            ...prev,
            { id: Date.now(), ...newMember, status: 'Invited' }
        ]);
        setNewMember({ name: '', email: '', role: 'Staff' });
        setIsInviteModalOpen(false);
    };

    const handleProfileUpdate = () => {
        updateUser(profileData);
        addAuditLog(`User profile updated for ${profileData.full_name}`, user?.full_name || 'Admin', 'action');
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const handleOrgUpdate = () => {
        addAuditLog(`Organization settings updated: ${companySettings.name}`, user?.full_name || 'Admin', 'action');
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const removeMember = (id) => {
        setTeamMembers(prev => prev.filter(m => m.id !== id));
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === id
                ? 'bg-black text-white shadow-lg shadow-black/10'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                }`}
        >
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
                    <p className="text-gray-500 text-sm">Manage company profile, team access, and automation rules</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <TabButton id="profile" label="My Profile" icon={User} />
                    <TabButton id="general" label="Organization" icon={Building} />
                    <TabButton id="team" label="Team" icon={Users} />
                    <TabButton id="rules" label="Automation" icon={SettingsIcon} />
                    <TabButton id="logs" label="Audit Logs" icon={History} />
                </div>
            </div>

            {/* Save Toast Notification */}
            {saveStatus === 'success' && (
                <div className="fixed bottom-10 right-10 bg-black text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up z-50 border border-white/10">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Changes Saved Successfully</p>
                        <p className="text-[10px] text-gray-400">Settings updated across all devices</p>
                    </div>
                </div>
            )}

            {/* TAB: PROFILE (Personal Settings) */}
            {activeTab === 'profile' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden max-w-4xl">
                    <div className="p-8 border-b border-gray-50 flex items-center gap-6 bg-gradient-to-r from-blue-50/30 to-white">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-[32px] bg-black text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-black/20 ring-4 ring-white">
                                {profileData.full_name[0] || 'U'}
                            </div>
                            <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-all">
                                <Plus size={16} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">{profileData.full_name || 'Your Name'}</h3>
                            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} className="text-blue-500" /> Admin Account
                            </p>
                            <div className="mt-3 flex gap-2">
                                <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full">ACTIVE SESSION</span>
                                <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black rounded-full">MFA ENABLED</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={profileData.full_name}
                                onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Identity</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={profileData.email}
                                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Professional Bio</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={profileData.bio}
                                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={profileData.phone}
                                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2 pt-6 flex justify-end">
                            <button
                                onClick={handleProfileUpdate}
                                className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-xl shadow-black/20 transition-all"
                            >
                                <Save size={18} /> Update Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: GENERAL (Company Profile) */}
            {activeTab === 'general' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden max-w-4xl">
                    <div className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-2xl">
                                {companySettings.name[0]}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Organization Logo</h3>
                                <p className="text-xs text-gray-400 font-medium">Replaces default avatar in reports</p>
                            </div>
                            <button className="ml-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Upload New</button>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Organization Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={companySettings.name}
                                    onChange={(e) => handleCompanyUpdate('name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">GSTIN / Tax ID</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 29AAAAA0000A1Z5"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={companySettings.gstin}
                                    onChange={(e) => handleCompanyUpdate('gstin', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Registered Address</label>
                                <textarea
                                    rows="3"
                                    placeholder="Enter full business address..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={companySettings.address}
                                    onChange={(e) => handleCompanyUpdate('address', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={companySettings.email}
                                    onChange={(e) => handleCompanyUpdate('email', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Website</label>
                                <input
                                    type="text"
                                    placeholder="https://"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={companySettings.website}
                                    onChange={(e) => handleCompanyUpdate('website', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="pt-6 flex justify-end border-t border-gray-50">
                            <button
                                onClick={handleOrgUpdate}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TEAM (User Management) */}
            {activeTab === 'team' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Authorized Users</h3>
                            <p className="text-xs text-gray-500">Manage access levels for your dashboard</p>
                        </div>
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                        >
                            <Plus size={16} /> Add Member
                        </button>
                    </div>
                    {/* Invite Modal */}
                    {isInviteModalOpen && (
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100 animate-scale-up">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Invite Team Member</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 outline-none focus:border-blue-500"
                                            value={newMember.name}
                                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 outline-none focus:border-blue-500"
                                            value={newMember.email}
                                            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Role</label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-900 outline-none focus:border-blue-500 bg-white"
                                            value={newMember.role}
                                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                        >
                                            <option value="Staff">Staff (Data Entry)</option>
                                            <option value="Admin">Admin (Full Access)</option>
                                            <option value="Auditor">Auditor (View Only)</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setIsInviteModalOpen(false)} className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100">Cancel</button>
                                        <button onClick={handleInvite} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-600/20">Send Invite</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest">
                                    <th className="px-6 py-4">User Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {teamMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                                                {member.name[0]}
                                            </div>
                                            {member.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">{member.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${member.role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                <span className="text-xs font-bold text-gray-600">{member.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {member.role !== 'Admin' && (
                                                <button
                                                    onClick={() => removeMember(member.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Remove User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: RULES (Automation) */}
            {activeTab === 'rules' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Tally Sync Rules</h3>
                        <p className="text-xs text-gray-500 mb-6">Configure how Pucho communicates with Tally ERP 9 / Prime.</p>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Auto-Import Vouchers</h4>
                                    <p className="text-xs text-gray-500">Pull entries from Tally every 15 mins</p>
                                </div>
                                <div
                                    onClick={() => setAutomationRules(prev => ({ ...prev, autoImport: !prev.autoImport }))}
                                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${automationRules.autoImport ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${automationRules.autoImport ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Sync Masters (Ledgers)</h4>
                                    <p className="text-xs text-gray-500">Create new Tally ledgers if missing</p>
                                </div>
                                <div
                                    onClick={() => setAutomationRules(prev => ({ ...prev, syncMasters: !prev.syncMasters }))}
                                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${automationRules.syncMasters ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${automationRules.syncMasters ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">AI Automation Limits</h3>
                        <p className="text-xs text-gray-500 mb-6">Safety thresholds for autonomous processing.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Auto-Approve Limit</label>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-900">₹</span>
                                    <input
                                        type="number"
                                        placeholder="5000"
                                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 font-bold"
                                        value={automationRules.autoApproveLimit}
                                        onChange={(e) => setAutomationRules(prev => ({ ...prev, autoApproveLimit: e.target.value }))}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 font-medium">Invoices below this amount will skip manual review.</p>
                            </div>
                            <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-xs font-bold w-fit">
                                    <AlertCircle size={14} /> AI Confidence Threshold: 95%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: LOGS (Audit Trail) */}
            {activeTab === 'logs' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Security Audit Trail</h3>
                        <p className="text-xs text-gray-500">Track all system interactions and changes</p>
                    </div>
                    <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
                        {auditLogs.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 italic">No activity logs recorded yet.</div>
                        ) : (
                            auditLogs.map((log) => (
                                <div key={log.id} className="space-y-3">
                                    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.type === 'action' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">{log.action}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{log.user}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{new Date(log.time).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                            className="text-[10px] font-black text-gray-400 uppercase underline tracking-tighter cursor-pointer hover:text-blue-500"
                                        >
                                            {expandedLog === log.id ? "CLOSE" : "DETAILS"}
                                        </div>
                                    </div>
                                    {expandedLog === log.id && (
                                        <div className="mx-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 font-medium animate-slide-down">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Log ID</p>
                                                    <p className="font-mono">{log.id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Precise Time</p>
                                                    <p>{new Date(log.time).toISOString()}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Source Interface</p>
                                                    <p>Pucho Dashboard v1.0 • System Interface • {log.type.toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
