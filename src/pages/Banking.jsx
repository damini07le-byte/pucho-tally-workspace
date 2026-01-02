import React, { useState } from 'react';
import { Search, Landmark, ChevronDown, ChevronUp, AlertCircle, FileText } from 'lucide-react';
import { useAccountFlow } from '../context/AccountFlowContext';

const Banking = () => {
    const { bankStatements } = useAccountFlow();
    const safeBankStatements = Array.isArray(bankStatements) ? bankStatements : [];
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStatementId, setExpandedStatementId] = useState(null);

    const formatINR = (val) => `₹ ${(val || 0).toLocaleString('en-IN')}`;

    const filteredStatements = safeBankStatements.filter(stmt => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const bankName = (stmt.summary?.bank_name || stmt.party || '').toLowerCase();
        const accNo = (stmt.summary?.account_number || '').toLowerCase();
        return bankName.includes(term) || accNo.includes(term);
    });

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Banking Docs</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and reconcile your bank statements</p>
                </div>

                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Bank or Account..."
                        className="pl-10 pr-4 py-2.5 w-full md:w-64 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-black/5 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Empty State */}
            {filteredStatements.length === 0 && (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Landmark className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Statements Found</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Upload a bank statement to get started.'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => document.getElementById('global-file-upload')?.click()}
                            className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
                        >
                            <Landmark size={16} /> Upload Now
                        </button>
                    )}
                </div>
            )}

            {/* Statements List */}
            <div className="space-y-4">
                {filteredStatements.map((stmt) => (
                    <div key={stmt.id} className={`bg-white rounded-[24px] border transition-all duration-300 ${expandedStatementId === stmt.id ? 'border-purple-200 shadow-xl shadow-purple-500/5 ring-1 ring-purple-50' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                        {/* Card Header Row */}
                        <div
                            className="p-5 flex flex-col lg:flex-row items-center justify-between gap-6 cursor-pointer"
                            onClick={() => setExpandedStatementId(expandedStatementId === stmt.id ? null : stmt.id)}
                        >
                            <div className="flex items-center gap-5 w-full lg:w-auto">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600">
                                    <Landmark size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Bank Account</p>
                                    <h3 className="text-sm font-bold text-gray-900">{stmt.summary?.bank_name || stmt.party || 'Unknown Bank'}</h3>
                                    <p className="text-xs text-gray-500 font-medium">A/C: {stmt.summary?.account_number || '****'}</p>
                                </div>
                                <div className="hidden md:block border-l border-gray-100 h-8 mx-2" />
                                <div className="hidden md:block">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Statement Date</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {stmt.summary?.date || (stmt.date && stmt.date.split('T')[0]) || '---'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full lg:w-auto gap-8">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Closing Balance</p>
                                    <p className="text-lg font-black text-gray-900">
                                        {formatINR(stmt.summary?.balance || stmt.amount)}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-full transition-transform duration-300 ${expandedStatementId === stmt.id ? 'bg-purple-50 text-purple-600 rotate-180' : 'bg-gray-50 text-gray-400'}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedStatementId === stmt.id && (
                            <div className="border-t border-gray-50 p-6 bg-gray-50/30 animate-slide-up rounded-b-[24px]">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/20 flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" /> Transactions
                                        </h4>
                                        <span className="px-3 py-1 bg-gray-100 rounded-full font-bold text-xs text-gray-500">
                                            {(stmt.summary?.bank_transactions?.length || 0)} ENTRIES
                                        </span>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 bg-gray-50/50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px]">Date</th>
                                                    <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px]">Description</th>
                                                    <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px] text-right">Debit</th>
                                                    <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px] text-right">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(stmt.summary?.bank_transactions || []).map((tr, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/30">
                                                        <td className="px-6 py-3 text-xs font-medium text-gray-500">
                                                            {tr.date || tr.transaction_date || '---'}
                                                        </td>
                                                        <td className="px-6 py-3 text-sm font-medium text-gray-900 max-w-md truncate">
                                                            {tr.description || tr.narration || 'Transaction'}
                                                        </td>
                                                        <td className="px-6 py-3 text-sm font-bold text-right text-red-500">
                                                            {(tr.debit_amount || tr.debit) ? formatINR(tr.debit_amount || tr.debit) : '-'}
                                                        </td>
                                                        <td className="px-6 py-3 text-sm font-bold text-right text-green-600">
                                                            {(tr.credit_amount || tr.credit) ? formatINR(tr.credit_amount || tr.credit) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!stmt.summary?.bank_transactions || stmt.summary.bank_transactions.length === 0) && (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-400 text-sm">
                                                            No transaction details available within this statement.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Banking;
