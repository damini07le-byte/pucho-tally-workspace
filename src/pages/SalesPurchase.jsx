import React, { useState, useMemo } from 'react';
import { Search, Download, ExternalLink, Filter, ChevronRight, ShoppingCart, Receipt, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccountFlow } from '../context/AccountFlowContext';
import InvoiceSummary from '../components/dashboard/InvoiceSummary';

const SalesPurchase = () => {
    const { postedVouchers, exportToTally, dashboardImpact, exportGSTR, exportGSTR3B } = useAccountFlow();
    const location = useLocation();
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(location.state?.highlightId || null);
    const [filterType, setFilterType] = useState('All'); // 'All', 'Sales', 'Purchase'
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');

    // Only show documents that have been manually approved and posted
    const allInvoices = useMemo(() => {
        if (!Array.isArray(postedVouchers)) return [];
        return [...postedVouchers].sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        });
    }, [postedVouchers]);

    const filteredInvoices = useMemo(() => {
        // Exclude Bank Statements globally from this view
        let filtered = allInvoices.filter(inv => {
            const type = (inv.type || '').toLowerCase();
            return !type.includes('bank') && !type.includes('statement');
        });

        // Filter by Type
        if (filterType !== 'All') {
            filtered = filtered.filter(inv => {
                const type = (inv.type || '').toLowerCase();
                return type.includes(filterType.toLowerCase()) && !type.includes('bank') && !type.includes('statement');
            });
        }

        // Filter by Date Range
        if (dateRange.start) {
            filtered = filtered.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate >= new Date(dateRange.start);
            });
        }
        if (dateRange.end) {
            filtered = filtered.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate <= new Date(dateRange.end);
            });
        }

        // Filter by Search Query (Party, ID, Amount)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(inv =>
                (inv.party || '').toLowerCase().includes(q) ||
                (inv.id || '').toLowerCase().includes(q) ||
                (inv.amount || '').toString().includes(q)
            );
        }

        return filtered;
    }, [allInvoices, filterType, dateRange, searchQuery]);

    const selectedInvoice = useMemo(() =>
        allInvoices.find(inv => inv.id === selectedInvoiceId),
        [allInvoices, selectedInvoiceId]);

    const { totalSales, totalPurchases } = useMemo(() => {
        return allInvoices.reduce((acc, inv) => {
            const amt = parseFloat(inv.amount || 0);
            if ((inv.type || '').toLowerCase().includes('sales')) {
                acc.totalSales += amt;
            } else if ((inv.type || '').toLowerCase().includes('purchase')) {
                acc.totalPurchases += amt;
            }
            return acc;
        }, { totalSales: 0, totalPurchases: 0 });
    }, [allInvoices]);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header section with summary cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Trade Register</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage all sales and purchase transactions</p>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button
                            onClick={() => exportGSTR('GSTR-1', 'csv')}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                            <Download size={14} /> GSTR-1
                        </button>
                        <button
                            onClick={() => exportGSTR('GSTR-2A', 'csv')}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                            <Download size={14} /> GSTR-2A
                        </button>
                        <button
                            onClick={() => exportGSTR3B()}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                            <Download size={14} /> GSTR-3B
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Sales</p>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <ShoppingCart size={20} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold">₹ {totalSales.toLocaleString()}</h2>
                    <div className="mt-4 w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-green-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (totalSales) / 10000)}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Purchases</p>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Receipt size={20} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold">₹ {totalPurchases.toLocaleString()}</h2>
                    <div className="mt-4 w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (totalPurchases) / 10000)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Filter section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
                        {['All', 'Sales', 'Purchase'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${filterType === type ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-50'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                        <input
                            type="date"
                            className="text-xs font-bold text-gray-600 outline-none bg-transparent"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-gray-300">to</span>
                        <input
                            type="date"
                            className="text-xs font-bold text-gray-600 outline-none bg-transparent"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                        {(dateRange.start || dateRange.end) && (
                            <button
                                onClick={() => setDateRange({ start: '', end: '' })}
                                className="text-[10px] font-black text-red-500 uppercase ml-2 hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Party, ID, or Amount..."
                        className="pl-10 pr-4 py-2.5 w-full md:w-64 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-black/5 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Horizontal Cards List */}
            <div className="space-y-4 overflow-x-auto scrollbar-hide pb-4">
                <div className="min-w-[700px] space-y-4 md:min-w-full">
                    {filteredInvoices.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                            <p className="text-gray-400">No transactions recorded yet. Upload a document to begin.</p>
                        </div>
                    ) : (
                        filteredInvoices.map((inv) => (
                            <div key={inv.id} className="group relative">
                                <div
                                    className={`flex items-center justify-between bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${selectedInvoiceId === inv.id ? 'ring-2 ring-black bg-gray-50/50' : ''
                                        }`}
                                    onClick={() => setSelectedInvoiceId(selectedInvoiceId === inv.id ? null : inv.id)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${(inv.type || '').toLowerCase().includes('sales') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {(inv.type || '').toLowerCase().includes('sales') ? <ShoppingCart size={22} /> : <Receipt size={22} />}
                                        </div>

                                        <div className="min-w-[120px]">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.type}</p>
                                            <p className="text-sm font-bold text-gray-900">{inv.id}</p>
                                        </div>

                                        <div className="hidden md:block border-l border-gray-100 h-8 mx-2" />

                                        <div className="hidden md:block">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                                            <p className="text-sm font-medium text-gray-600">
                                                {inv.date && !isNaN(new Date(inv.date))
                                                    ? new Date(inv.date).toLocaleDateString()
                                                    : (inv.details?.summary?.date || 'N/A')}
                                            </p>
                                        </div>

                                        <div className="hidden lg:block border-l border-gray-100 h-8 mx-2" />

                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Party</p>
                                            <p className="text-sm font-bold text-gray-900">{inv.party || inv.details?.summary?.party || 'Unknown Vendor'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</p>
                                            <p className="text-lg font-black text-gray-900">₹ {(inv.amount || 0).toLocaleString()}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); exportToTally(inv.id); }}
                                                className="p-3 bg-gray-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all border border-gray-100"
                                                title="Export to Tally XML"
                                            >
                                                <Zap size={18} />
                                            </button>
                                            <button
                                                onClick={() => setSelectedInvoiceId(selectedInvoiceId === inv.id ? null : inv.id)}
                                                className={`p-3 rounded-2xl transition-all ${selectedInvoiceId === inv.id ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-black hover:text-white'
                                                    }`}
                                                title="Explore Details"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Detail Expansion */}
                                {selectedInvoiceId === inv.id && (
                                    <div className="mt-4 space-y-4 animate-slide-up bg-gray-50/50 p-6 rounded-3xl border border-gray-100 border-dashed">
                                        <InvoiceSummary summary={inv.details?.summary || inv.summary} />

                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="p-4 border-b border-gray-100 bg-gray-50/20 flex justify-between items-center">
                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Line Items</h4>
                                                <span className="text-xs px-3 py-1 bg-gray-100 rounded-full font-bold text-gray-500">
                                                    {(inv.details?.items?.length || 0)} ITEMS
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto scrollbar-hide">
                                                <table className="w-full min-w-[700px] text-left">
                                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                                        <tr>
                                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[10px]">Description</th>
                                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[10px]">Qty</th>
                                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[10px]">Rate</th>
                                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[10px] text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {(inv.details?.items || []).map((item, idx) => (
                                                            <tr key={idx} className="hover:bg-gray-50/30">
                                                                <td className="px-6 py-4 font-medium text-gray-900">{item.description}</td>
                                                                <td className="px-6 py-4 text-gray-600">{item.quantity}</td>
                                                                <td className="px-6 py-4 text-gray-600">₹ {(item.rate || 0).toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right font-bold text-gray-900">₹ {(item.amount || 0).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesPurchase;
