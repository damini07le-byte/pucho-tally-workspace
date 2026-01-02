import React, { useMemo, useState } from 'react';
import { useAccountFlow } from '../context/AccountFlowContext';
import { Box, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownLeft, Package, Search, ChevronDown, History } from 'lucide-react';

const Inventory = () => {
    const { postedVouchers } = useAccountFlow();
    const safePostedVouchers = Array.isArray(postedVouchers) ? postedVouchers : [];
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedItem, setExpandedItem] = useState(null);

    // Calculate stock data from posted vouchers
    const inventoryData = useMemo(() => {
        const itemsMap = {};

        safePostedVouchers.forEach(v => {
            const isPurchase = (v.type || '').toLowerCase().includes('purchase');
            const items = v.details?.items || v.summary?.items || [];

            items.forEach(item => {
                const name = item.description || 'Unknown Item';
                if (!itemsMap[name]) {
                    itemsMap[name] = {
                        name,
                        stock: 0,
                        valuation: 0,
                        totalIn: 0,
                        totalOut: 0,
                        lastPrice: 0
                    };
                }

                const qty = parseFloat(item.quantity) || 0;
                const amt = parseFloat(item.amount) || 0;

                if (isPurchase) {
                    itemsMap[name].stock += qty;
                    itemsMap[name].totalIn += qty;
                    itemsMap[name].lastPrice = amt / (qty || 1);
                } else {
                    itemsMap[name].stock -= qty;
                    itemsMap[name].totalOut += qty;
                }

                itemsMap[name].valuation = itemsMap[name].stock * itemsMap[name].lastPrice;
            });
        });

        return Object.values(itemsMap);
    }, [safePostedVouchers]);

    const stats = useMemo(() => {
        return {
            totalItems: inventoryData.length,
            totalValuation: inventoryData.reduce((acc, curr) => acc + curr.valuation, 0),
            lowStock: inventoryData.filter(i => i.stock < 5).length
        };
    }, [inventoryData]);

    const filteredInventory = useMemo(() => {
        return inventoryData.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inventoryData, searchTerm]);

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <Box size={24} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total SKUs</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">{stats.totalItems}</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic">Unique tracked items</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Value</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">₹ {stats.totalValuation.toLocaleString()}</h2>
                    <p className="text-sm text-green-600 mt-1 font-bold flex items-center gap-1">
                        <ArrowUpRight size={14} /> AI Valuation
                    </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Low Stock</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">{stats.lowStock}</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Items below reorder point</p>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">Real-time Stock Ledger</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Auto-Updated from Vouchers</p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-black/5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">In</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Out</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Closing Stock</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valuation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic font-medium">
                                        No matching inventory items found.
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <tr
                                            className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedItem === item.name ? 'bg-blue-50/30' : ''}`}
                                            onClick={() => setExpandedItem(expandedItem === item.name ? null : item.name)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-50 rounded-lg">
                                                        <Box size={16} className="text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Avg Price: ₹ {item.lastPrice.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-blue-600">+{item.totalIn}</td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-red-600">-{item.totalOut}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`px-3 py-1 rounded-lg text-sm font-black ${item.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                        {item.stock}
                                                    </span>
                                                    {item.stock < 5 && <p className="text-[8px] font-black text-red-400 mt-1">LOW STOCK</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900 flex flex-col items-end">
                                                ₹ {item.valuation.toLocaleString()}
                                                <span className="text-[8px] font-bold text-gray-300">BOOK VALUE</span>
                                            </td>
                                        </tr>
                                        {expandedItem === item.name && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 bg-gray-50/30">
                                                    <div className="animate-slide-up flex flex-col gap-4">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            <History size={14} /> Quick Performance
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                                <p className="text-[8px] font-black text-gray-300 uppercase">Turnover Rate</p>
                                                                <p className="text-lg font-black text-indigo-600">{(item.totalOut / (item.totalIn || 1)).toFixed(2)}x</p>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                                <p className="text-[8px] font-black text-gray-300 uppercase">Avg Daily Out</p>
                                                                <p className="text-lg font-black text-gray-800">{(item.totalOut / 30).toFixed(1)}</p>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-xl border border-gray-100">
                                                                <p className="text-[8px] font-black text-gray-300 uppercase">Demand Signal</p>
                                                                <p className="text-lg font-black text-green-600">STABLE</p>
                                                            </div>
                                                            <button className="bg-black text-white p-4 rounded-xl border border-gray-800 flex items-center justify-center font-bold text-xs hover:bg-gray-800 transition-all">
                                                                Full Ledger
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
