import React, { useState, useMemo } from 'react';
import { useAccountFlow } from '../context/AccountFlowContext';
import {
    TrendingUp, Clock, Info, Database, Zap, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const CardsGrid = () => {
    const { status, postedVouchers, dashboardImpact, bankStatements, setDashboardImpact } = useAccountFlow();

    // Detailed Safe Guards
    const safePostedVouchers = Array.isArray(postedVouchers) ? postedVouchers : [];
    const safeBankStatements = Array.isArray(bankStatements) ? bankStatements : [];

    const [editingCard, setEditingCard] = useState(null);
    const [newValue, setNewValue] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        await new Promise(r => setTimeout(r, 2000));
        setIsSyncing(false);
    };

    const metrics = useMemo(() => {
        let sales = 0;
        let purchase = 0;
        let bank = dashboardImpact?.bank_balance !== 0 ? dashboardImpact?.bank_balance : (safeBankStatements[0]?.summary?.balance || 0);

        let gstIn = 0;
        let gstOut = 0;

        safePostedVouchers.forEach(v => {
            const amt = parseFloat(v.amount) || 0;
            const tax = parseFloat(v.details?.summary?.tax_amount || 0);
            const type = (v.type || '').toLowerCase();
            const isSales = type.includes('sales') || type.includes('revenue');
            const isExpense = type.includes('purchase') || type.includes('bill') || type.includes('payment') || type.includes('expense');

            if (isSales) {
                sales += amt;
                gstOut += tax;
            } else if (isExpense) {
                purchase += amt;
                gstIn += tax;
            }
        });

        return [
            { title: "Cash Balance", value: dashboardImpact?.cash_balance || 0, desc: "Click to set opening", color: "text-green-600", trend: "+2.4%", editable: true, key: 'cash_balance' },
            { title: "Bank Balance", value: bank, desc: "Click to set opening", color: "text-blue-600", trend: "Live", editable: true, key: 'bank_balance' },
            { title: "Receivables", value: sales || dashboardImpact?.receivables || 0, desc: "Total Approved Sales", color: "text-purple-600", trend: "Up 12%" },
            { title: "Payables", value: purchase || dashboardImpact?.payables || 0, desc: "Total Approved Purchases", color: "text-red-600", trend: "Live" },
            { title: "GST Credit (ITC)", value: gstIn || dashboardImpact?.gst_input || 0, desc: "Input Tax Credit", color: "text-emerald-600", trend: "Balanced" },
            { title: "GST Liability", value: gstOut || dashboardImpact?.gst_output || 0, desc: "Tax to be paid", color: "text-amber-600", trend: "Due soon" },
        ];
    }, [safePostedVouchers, safeBankStatements, dashboardImpact]);

    const chartData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dataMap = days.map(day => ({ name: day, revenue: 0, expenses: 0 }));

        safePostedVouchers.forEach(v => {
            const voucherDate = v.date || v.timestamp;
            if (!voucherDate) return;

            const date = new Date(voucherDate);
            if (isNaN(date.getTime())) return;

            const dayName = days[date.getDay()];
            const amt = parseFloat(v.amount) || 0;
            const entry = dataMap.find(d => d.name === dayName);
            const type = (v.type || '').toLowerCase();

            if (entry) {
                if (type.includes('sales') || type.includes('revenue')) {
                    entry.revenue += amt;
                } else if (type.includes('purchase') || type.includes('bill') || type.includes('payment') || type.includes('expense')) {
                    entry.expenses += amt;
                }
            }
        });

        return dataMap;
    }, [safePostedVouchers]);

    const pieData = useMemo(() => {
        let gstIn = 0;
        let gstOut = 0;

        safePostedVouchers.forEach(v => {
            const tax = parseFloat(v.details?.summary?.tax_amount || 0);
            const type = (v.type || '').toLowerCase();
            if (type.includes('sales') || type.includes('revenue')) gstOut += tax;
            else if (type.includes('purchase') || type.includes('bill') || type.includes('payment') || type.includes('expense')) gstIn += tax;
        });

        return [
            { name: 'GST Input', value: gstIn || dashboardImpact?.gst_input || 0, color: '#10b981' },
            { name: 'GST Output', value: gstOut || dashboardImpact?.gst_output || 0, color: '#f59e0b' },
            { name: 'Receivables', value: metrics.find(m => m.title === 'Receivables')?.value || 0, color: '#6366f1' },
        ].filter(i => i.value > 0);
    }, [safePostedVouchers, dashboardImpact, metrics]);

    const itemSalesData = useMemo(() => {
        const itemMap = {};
        safePostedVouchers.forEach(v => {
            const isSales = (v.type || '').toLowerCase().includes('sales');
            if (!isSales) return;

            const items = v.details?.items || v.summary?.items || [];
            items.forEach(item => {
                const name = item.description || item.item_name || 'Generic Service';
                const total = parseFloat(item.amount || item.total || 0);
                if (!itemMap[name]) itemMap[name] = 0;
                itemMap[name] += total;
            });
        });

        return Object.entries(itemMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [safePostedVouchers]);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                        <Database size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tally ERP 9 Sync</h2>
                            <span className="px-2.5 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase border border-green-100">Active</span>
                        </div>
                        <p className="text-sm text-gray-400 font-medium tracking-wide">Last Sync: <span className="text-gray-900">Just now</span> | Organization: <span className="text-gray-900">Pucho Global Solutions</span></p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-black/10 ${isSyncing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                    >
                        <Zap size={16} fill="white" className={isSyncing ? 'animate-pulse' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync Cloud'}
                    </button>
                    <button className="p-2.5 border border-gray-100 rounded-full hover:bg-gray-50 transition-colors text-gray-400">
                        <Clock size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{m.title}</p>
                            <div className={`p-2 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-colors ${m.color}`}>
                                <TrendingUp size={16} />
                            </div>
                        </div>
                        {m.editable && editingCard === m.title ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-lg font-bold"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        setDashboardImpact(prev => ({ ...prev, [m.key]: parseFloat(newValue) || 0 }));
                                        setEditingCard(null);
                                    }}
                                    className="p-1 bg-blue-600 text-white rounded-md text-xs font-bold"
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <h2
                                className={`text-2xl font-black ${m.color} ${m.editable ? 'cursor-edit' : ''}`}
                                onClick={() => {
                                    if (m.editable) {
                                        setNewValue(m.value);
                                        setEditingCard(m.title);
                                    }
                                }}
                            >
                                ₹ {(m.value || 0).toLocaleString('en-IN')}
                            </h2>
                        )}
                        <p className="text-[11px] font-bold text-gray-300 mt-2 flex items-center gap-1 uppercase tracking-tighter">
                            <Info size={12} /> {m.desc}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 size={20} className="text-indigo-500" /> Cash Flow Analytics
                        </h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase"><div className="w-2 h-2 rounded-full bg-blue-500" /> Revenue</span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase"><div className="w-2 h-2 rounded-full bg-red-400" /> Expenses</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={3} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <PieIcon size={20} className="text-amber-500" /> Tax Distribution
                    </h3>
                    <div className="h-[300px] w-full flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* New: Top Revenue Sources Section */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Top Revenue Sources</h3>
                        <p className="text-sm text-gray-500 mt-1">Highest earning products and services this period</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <BarChart3 size={24} />
                    </div>
                </div>

                {itemSalesData.length > 0 ? (
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={itemSalesData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f8fafc" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 13, fontWeight: 700, fill: '#475569' }}
                                    width={120}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₹ ${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#6366f1"
                                    radius={[0, 8, 8, 0]}
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[200px] flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Info className="text-gray-300 mb-2" size={32} />
                        <p className="text-gray-400 font-medium">No sales data available to analyze.<br />Upload sales invoices to see top items.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardsGrid;
