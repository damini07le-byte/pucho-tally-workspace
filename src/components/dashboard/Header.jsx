import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useAccountFlow } from "../../context/AccountFlowContext";
import MenuIcon from '../../assets/icons/menu.svg';
import SearchIcon from '../../assets/icons/search.svg';
import BellIcon from '../../assets/icons/bell.png';
import { Landmark, Trash2 } from 'lucide-react';

const Header = ({ onMenuClick }) => {
    const { processUpload, status, clearData, setDashboardImpact } = useAccountFlow();
    const [isFocused, setIsFocused] = useState(false);
    const [isAddingCash, setIsAddingCash] = useState(false);
    const [addMode, setAddMode] = useState('cash'); // 'cash' | 'bank'
    const [cashInput, setCashInput] = useState('');
    const location = useLocation();

    // Map paths to Title and Description
    const pageMetadata = {
        '/admin': { title: 'Accounting Overview', description: 'Manage accounts and financial tracking' },
        '/admin/agents': { title: 'Ledgers', description: 'Manage accounts and groups' },
        '/admin/vouchers': { title: 'Vouchers', description: 'Review and create voucher entries' },
        '/admin/flow': { title: 'Sales and Purchase', description: 'Monitor trade transactions' },
        '/admin/activity': { title: 'Banking Docs', description: 'Bank reconciliation and cash management' },
        '/admin/mcp': { title: 'Reports', description: 'Financial statements and analysis' },
        '/admin/knowledge': { title: 'Inventory', description: 'Stock tracking and valuation' },
        '/admin/gst': { title: 'GST', description: 'Compliance and tax reporting' },
        '/admin/settings': { title: 'Configuration', description: 'System and tally preferences' },
    };

    const currentPath = location.pathname;
    const { title, description } = pageMetadata[currentPath] || { title: 'Dashboard', description: 'Welcome to Pucho Dashboard' };

    const handleAddCash = () => {
        const amount = parseFloat(cashInput) || 0;
        if (amount > 0) {
            setDashboardImpact(prev => {
                const newImpact = { ...prev };
                if (addMode === 'cash') {
                    newImpact.cash_balance = (prev.cash_balance || 0) + amount;
                } else {
                    newImpact.bank_balance = (prev.bank_balance || 0) + amount;
                }
                return newImpact;
            });
            setIsAddingCash(false);
            setCashInput('');
        }
    };

    return (
        <header className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
            {/* Left Side: Menu Toggle + Dynamic Title */}
            <div className="flex items-center gap-4 h-[44px]">
                <button onClick={onMenuClick} className="lg:hidden p-1 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
                    <img src={MenuIcon} alt="Menu" className="w-6 h-6 opacity-60" />
                </button>

                <div className="flex flex-col justify-center min-w-0">
                    <h1 className="text-lg md:text-xl font-bold text-[#111935] leading-none mb-1 truncate">{title}</h1>
                    <p className="text-[10px] md:text-sm text-gray-500 font-medium leading-none truncate">{description}</p>
                </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    {/* Add Cash Button */}
                    <button
                        onClick={() => setIsAddingCash(true)}
                        className="p-2 md:p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200 shrink-0"
                        title="Add Cash"
                    >
                        <Landmark size={18} />
                    </button>

                    {/* Upload Button */}
                    <button
                        onClick={() => document.getElementById('global-file-upload')?.click()}
                        disabled={status !== 'idle' && status !== 'posted' && status !== 'error' && status !== 'pending_review'}
                        className={`
                            px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0
                            ${status === 'uploading' || (status !== 'idle' && status !== 'posted' && status !== 'error' && status !== 'pending_review') ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10'}
                        `}
                    >
                        {status === 'idle' || status === 'posted' || status === 'error' || status === 'pending_review' ? (
                            <>
                                <div className="p-1 bg-white/20 rounded-lg">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </div>
                                <span className="hidden md:inline text-xs md:text-sm">Upload Documents</span>
                                <span className="md:hidden text-xs">Upload</span>
                            </>
                        ) : (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        )}
                    </button>
                    <input
                        id="global-file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processUpload(file);
                        }}
                    />
                </div>

                {/* Clear Button */}
                <button
                    onClick={clearData}
                    className="p-2 md:p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 shrink-0 mx-1"
                    title="Clear All Data"
                >
                    <Trash2 size={18} />
                </button>

                <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-100">
                    <img src={BellIcon} alt="Notifications" className="w-5 h-5 opacity-40 cursor-pointer hover:opacity-100 transition-opacity" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden lg:block">CA Admin</span>
                </div>
            </div>

            {/* Add Cash/Bank Modal - Portal used to escape Header's backdrop-filter context */}
            {isAddingCash && createPortal(
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Inject Capital</h3>
                        <p className="text-sm text-gray-500 mb-6">Manually add opening balance to your accounts.</p>

                        <div className="space-y-4">
                            {/* Mode Selector */}
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                <button
                                    onClick={() => setAddMode('cash')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${addMode === 'cash' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Cash Balance
                                </button>
                                <button
                                    onClick={() => setAddMode('bank')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${addMode === 'bank' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Bank Balance
                                </button>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                                    {addMode === 'cash' ? 'Cash Amount (INR)' : 'Bank Balance (INR)'}
                                </label>
                                <input
                                    type="number"
                                    autoFocus
                                    placeholder="e.g. 50000"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    value={cashInput}
                                    onChange={(e) => setCashInput(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsAddingCash(false)}
                                    className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddCash}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
};

export default Header;
