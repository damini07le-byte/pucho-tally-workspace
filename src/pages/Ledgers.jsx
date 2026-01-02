import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, BookOpen, ExternalLink, BarChart2, ShieldCheck, X } from 'lucide-react';
import { useAccountFlow } from '../context/AccountFlowContext';

const Ledgers = () => {
    const { ledgers, addLedger } = useAccountFlow();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLedger, setExpandedLedger] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLedger, setNewLedger] = useState({ name: '', group: 'Sundry Debtors', type: 'Customer', balance: 0 });

    const handleCreateLedger = (e) => {
        e.preventDefault();
        addLedger(newLedger);
        setIsModalOpen(false);
        setNewLedger({ name: '', group: 'Sundry Debtors', type: 'Customer', balance: 0 });
    };

    const safeLedgers = Array.isArray(ledgers) ? ledgers : [];

    const filteredLedgers = safeLedgers.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Ledger Master</h1>
                    <p className="text-gray-500 text-xs md:text-sm">Manage accounts, AI group suggestions, and compliance</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 bg-black text-white rounded-xl md:rounded-full text-xs md:text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm"
                >
                    <Plus size={18} />
                    <span className="truncate">Create Ledger</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search ledgers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Ledger Name</th>
                                <th className="px-6 py-4">Accounting Group</th>
                                <th className="px-6 py-4">Current Balance</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLedgers.map((ledger, i) => (
                                <React.Fragment key={i}>
                                    <tr
                                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedLedger === ledger.name ? 'bg-indigo-50/30' : ''}`}
                                        onClick={() => setExpandedLedger(expandedLedger === ledger.name ? null : ledger.name)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black">
                                                    {ledger.name[0]}
                                                </div>
                                                <span className="font-bold text-gray-900">{ledger.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase text-gray-400 border border-gray-100 px-2 py-0.5 rounded">
                                                {ledger.group}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-black text-sm ${ledger.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ₹ {Math.abs(ledger.balance).toLocaleString()} {ledger.balance >= 0 ? 'Dr' : 'Cr'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ledger.type === 'Customer' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                }`}>
                                                {ledger.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${ledger.status === 'Verified' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ledger.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <MoreVertical size={16} className="text-gray-400" />
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedLedger === ledger.name && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 bg-gray-50/30">
                                                <div className="animate-slide-up grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="col-span-2 space-y-4">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            <BarChart2 size={14} /> Account Intelligence
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                                <p className="text-[8px] font-black text-gray-300 uppercase">Turnover (Current Month)</p>
                                                                <p className="text-lg font-black text-gray-900 font-mono">₹ {(Math.abs(ledger.balance) * 0.4).toLocaleString()}</p>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                                <p className="text-[8px] font-black text-gray-300 uppercase">Avg Credit Period</p>
                                                                <p className="text-lg font-black text-gray-900">14 Days</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl text-indigo-700">
                                                            <ShieldCheck size={16} />
                                                            <p className="text-[10px] font-bold">This ledger has been auto-classified by AI as {ledger.group}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 justify-center">
                                                        <button className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                                                            <ExternalLink size={14} /> Full Transaction History
                                                        </button>
                                                        <button className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 bg-white text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                                                            Edit Account Mapping
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {filteredLedgers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">No ledgers found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Ledger Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Create New Ledger</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLedger} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ledger Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 font-bold"
                                    placeholder="Enter account name..."
                                    value={newLedger.name}
                                    onChange={(e) => setNewLedger({ ...newLedger, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 font-bold"
                                        value={newLedger.type}
                                        onChange={(e) => setNewLedger({ ...newLedger, type: e.target.value, group: e.target.value === 'Customer' ? 'Sundry Debtors' : 'Sundry Creditors' })}
                                    >
                                        <option value="Customer">Customer</option>
                                        <option value="Vendor">Vendor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Opening Balance</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 font-bold"
                                        value={newLedger.balance}
                                        onChange={(e) => setNewLedger({ ...newLedger, balance: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <div className="flex items-center gap-2 text-blue-700 mb-1">
                                    <ShieldCheck size={16} />
                                    <p className="text-[10px] font-black uppercase">AI Suggestion</p>
                                </div>
                                <p className="text-xs text-blue-800 font-medium">System will auto-map this to <span className="font-bold underline">{newLedger.group}</span> in Tally.</p>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all mt-4"
                            >
                                Create Account
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ledgers;
