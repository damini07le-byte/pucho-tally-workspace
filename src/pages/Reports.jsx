import React, { useState, useMemo } from 'react';
import { useAccountFlow } from '../context/AccountFlowContext';
import { BarChart3, TrendingUp, TrendingDown, Scale, FileText, ArrowDown, ArrowUp, Download, Plus, Printer, Filter } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell, PieChart, Pie, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/pucho_logo_sidebar_v2.png';

const Reports = () => {
    const { postedVouchers, ledgers, dashboardImpact, bankStatements } = useAccountFlow();
    // Safe Array Wrappers to prevent crashes
    const safePostedVouchers = Array.isArray(postedVouchers) ? postedVouchers : [];
    const safeLedgers = Array.isArray(ledgers) ? ledgers : [];
    const safeBankStatements = Array.isArray(bankStatements) ? bankStatements : [];

    const [activeTab, setActiveTab] = useState('pnl'); // pnl, bs, tb
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // --- PROFIT & LOSS LOGIC ---
    const pnlData = useMemo(() => {
        let revenue = 0;
        let expenses = 0;
        const monthlyDataMap = {};

        safePostedVouchers.forEach(v => {
            let voucherDate = v.date;
            // Handle potentially invalid or missing date
            if (!voucherDate) {
                voucherDate = v.timestamp || new Date().toISOString();
            }

            const date = new Date(voucherDate);
            if (isNaN(date.getTime())) return; // Skip invalid entries

            // Filter by Date Range
            if (dateRange.start && date < new Date(dateRange.start)) return;
            if (dateRange.end && date > new Date(dateRange.end)) return;

            const amt = parseFloat(v.amount) || 0;
            const type = (v.type || '').toLowerCase();
            const month = date.toLocaleString('default', { month: 'short' });

            if (!monthlyDataMap[month]) {
                monthlyDataMap[month] = { name: month, revenue: 0, expenses: 0 };
            }

            if (type.includes('sales') || type.includes('revenue')) {
                revenue += amt;
                monthlyDataMap[month].revenue += amt;
            } else if (type.includes('purchase') || type.includes('bill') || type.includes('payment') || type.includes('expense')) {
                expenses += amt;
                monthlyDataMap[month].expenses += amt;
            }
            monthlyDataMap[month].netFlow = monthlyDataMap[month].revenue - monthlyDataMap[month].expenses;
        });

        const monthlyTrend = Object.values(monthlyDataMap);

        return {
            revenue,
            expenses,
            netProfit: revenue - expenses,
            monthlyTrend
        };
    }, [safePostedVouchers, dateRange]);

    // --- BALANCE SHEET LOGIC ---
    const bsData = useMemo(() => {
        // Assets
        const cash = dashboardImpact?.cash_balance || 0;
        const bank = dashboardImpact?.bank_balance || safeBankStatements[0]?.summary?.balance || 0;
        const debtors = safeLedgers
            .filter(l => l.group === 'Sundry Debtors')
            .reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);

        // Calculate Closing Stock (Simplified Weighted Avg from Inventory Page Logic)
        let closingStockValuation = 0;
        const itemsMap = {};
        safePostedVouchers.forEach(v => {
            const isPurchase = (v.type || '').toLowerCase().includes('purchase');
            const items = v.details?.items || v.summary?.items || [];
            items.forEach(item => {
                const name = item.description || 'Unknown';
                if (!itemsMap[name]) itemsMap[name] = { stock: 0, price: 0 };
                const qty = parseFloat(item.quantity) || 0;
                const amt = parseFloat(item.amount) || 0;

                if (isPurchase) {
                    itemsMap[name].stock += qty;
                    itemsMap[name].price = amt / (qty || 1);
                } else {
                    itemsMap[name].stock -= qty;
                }
            });
        });
        Object.values(itemsMap).forEach(i => {
            closingStockValuation += (i.stock * i.price);
        });

        // Liabilities
        const creditors = safeLedgers
            .filter(l => l.group === 'Sundry Creditors')
            .reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);

        const dutiesAndTaxes = (dashboardImpact?.gst_output || 0) - (dashboardImpact?.gst_input || 0);

        const totalAssets = cash + bank + debtors + closingStockValuation;
        const totalLiabilities = creditors + Math.max(0, dutiesAndTaxes) + pnlData.netProfit; // Net Profit goes to Capital Account

        return {
            assets: { cash, bank, debtors, stock: closingStockValuation },
            liabilities: { creditors, duties: Math.max(0, dutiesAndTaxes), profit: pnlData.netProfit },
            totalAssets,
            totalLiabilities
        };
    }, [dashboardImpact, safeBankStatements, safeLedgers, safePostedVouchers, pnlData.netProfit, dateRange]);

    const handleExportPDF = () => {
        const doc = new jsPDF();

        try {
            // Validating Logo
            const img = new Image();
            img.src = logo;
            // Only add if loaded, but for sync call we trust import or add fallback
            doc.addImage(img, 'PNG', 14, 10, 40, 10);
        } catch (e) {
            console.warn('Logo load failed for PDF', e);
        }

        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text("Pucho.ai Dashboard", 14, 30);

        doc.setFontSize(14);
        doc.text("Trial Balance Report", 14, 40);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 48);

        // Table Rows
        const tableRows = [];

        // Sales
        tableRows.push(['Sales Accounts', '-', `Rs. ${pnlData.revenue.toLocaleString()}`]);
        // Purchase
        tableRows.push(['Purchase Accounts', `Rs. ${pnlData.expenses.toLocaleString()}`, '-']);

        // Ledgers
        safeLedgers.forEach(l => {
            tableRows.push([
                `${l.name} (${l.group})`,
                l.balance >= 0 && l.group === 'Sundry Debtors' ? `Rs. ${l.balance.toLocaleString()}` : '-',
                l.balance >= 0 && l.group === 'Sundry Creditors' ? `Rs. ${l.balance.toLocaleString()}` : '-'
            ]);
        });

        // Cash Bank
        const totalCashBank = (dashboardImpact?.cash_balance || 0) + (dashboardImpact?.bank_balance || 0);
        tableRows.push(['Cash & Bank Balances', `Rs. ${totalCashBank.toLocaleString()}`, '-']);

        autoTable(doc, {
            head: [['Particulars', 'Debit (Dr)', 'Credit (Cr)']],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'right' } },
        });

        doc.save('Tally_Trial_Balance.pdf');
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === id
                ? 'bg-black text-white shadow-lg shadow-black/10'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                }`}
        >
            <Icon size={18} /> {label}
        </button>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                    <p className="text-gray-500 text-sm">Real-time Balance Sheet, P&L, and Trial Balance</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                    <TabButton id="pnl" label="P&L" icon={TrendingUp} />
                    <TabButton id="bs" label="BS" icon={Scale} />
                    <TabButton id="tb" label="Trial" icon={FileText} />
                </div>
            </div>

            {/* Date Filters */}
            <div className="flex bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm w-fit gap-3 items-center">
                <Filter size={16} className="text-gray-400" />
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

            {/* TAB CONTENT: PROFIT & LOSS */}
            {activeTab === 'pnl' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Summary Cards */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Total Revenue</p>
                            <h2 className="text-3xl font-black text-green-600">₹ {pnlData.revenue.toLocaleString()}</h2>
                            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg w-fit">
                                <ArrowUp size={14} /> Sales Accounts
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Total Expenses</p>
                            <h2 className="text-3xl font-black text-red-600">₹ {pnlData.expenses.toLocaleString()}</h2>
                            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-lg w-fit">
                                <ArrowDown size={14} /> Purchase Accounts
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className={`absolute inset-0 opacity-10 ${pnlData.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Net Profit / (Loss)</p>
                            <h2 className={`text-3xl font-black ${pnlData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹ {Math.abs(pnlData.netProfit).toLocaleString()}
                            </h2>
                            <p className="text-sm text-gray-500 mt-2 font-medium italic">Transferred to Capital A/c</p>
                        </div>
                    </div>

                    {/* Performance Chart (Bar) */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Revenue vs Expense Trend</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-xs font-bold text-gray-500">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-xs font-bold text-gray-500">Expenses</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pnlData.monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Cash Flow Trend Chart (Line) */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Cash Flow Trend</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-xs font-bold text-gray-500">Net Flow</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={pnlData.monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                                    <Tooltip
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="netFlow" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed View */}
                    <div className="md:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Income Statement</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                                <span className="font-medium text-gray-600">Sales Account (Direct Income)</span>
                                <span className="font-bold text-gray-900">₹ {pnlData.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                                <span className="font-medium text-gray-600">Purchase Account (Direct Expense)</span>
                                <span className="font-bold text-gray-900">(₹ {pnlData.expenses.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between items-center py-4 bg-gray-50 rounded-xl px-4 mt-4">
                                <span className="text-lg font-black text-gray-900">Net Profit</span>
                                <span className={`text-lg font-black ${pnlData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹ {pnlData.netProfit.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: BALANCE SHEET */}
            {activeTab === 'bs' && (
                <div className="space-y-6">
                    {/* Asset Distribution Chart */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Asset Composition</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Cash', value: bsData.assets.cash, color: '#22c55e' },
                                            { name: 'Bank', value: bsData.assets.bank, color: '#3b82f6' },
                                            { name: 'Debtors', value: bsData.assets.debtors, color: '#8b5cf6' },
                                            { name: 'Stock', value: bsData.assets.stock, color: '#f59e0b' },
                                        ].filter(i => i.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {[
                                            { color: '#22c55e' },
                                            { color: '#3b82f6' },
                                            { color: '#8b5cf6' },
                                            { color: '#f59e0b' },
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Liabilities */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
                            <div className="bg-red-50/50 p-6 border-b border-red-100">
                                <h3 className="text-lg font-black text-red-900 uppercase tracking-widest">Liabilities</h3>
                            </div>
                            <div className="p-6 space-y-1">
                                {/* Capital Account */}
                                <div className="flex justify-between py-3 border-b border-gray-50">
                                    <span className="font-bold text-gray-700">Capital Account (Profit)</span>
                                    <span className="font-bold text-gray-900">₹ {bsData.liabilities.profit.toLocaleString()}</span>
                                </div>
                                {/* Current Liabilities */}
                                <div className="pt-4 pb-2">
                                    <span className="text-xs font-black text-gray-400 uppercase">Current Liabilities</span>
                                </div>
                                <div className="flex justify-between py-2 pl-4">
                                    <span className="font-medium text-gray-600">Sundry Creditors</span>
                                    <span className="font-medium text-gray-900">₹ {bsData.liabilities.creditors.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 pl-4">
                                    <span className="font-medium text-gray-600">Duties & Taxes</span>
                                    <span className="font-medium text-gray-900">₹ {bsData.liabilities.duties.toLocaleString()}</span>
                                </div>
                                {/* Total */}
                                <div className="mt-6 p-4 bg-red-50 rounded-xl flex justify-between items-center">
                                    <span className="font-black text-red-900">TOTAL LIABILITIES</span>
                                    <span className="font-black text-lg text-red-900">₹ {bsData.totalLiabilities.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Assets */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit">
                            <div className="bg-green-50/50 p-6 border-b border-green-100">
                                <h3 className="text-lg font-black text-green-900 uppercase tracking-widest">Assets</h3>
                            </div>
                            <div className="p-6 space-y-1">
                                {/* Current Assets */}
                                <div className="pt-2 pb-2">
                                    <span className="text-xs font-black text-gray-400 uppercase">Current Assets</span>
                                </div>
                                <div className="flex justify-between py-2 pl-4">
                                    <span className="font-medium text-gray-600">Closing Stock</span>
                                    <span className="font-medium text-gray-900">₹ {bsData.assets.stock.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 pl-4">
                                    <span className="font-medium text-gray-600">Sundry Debtors</span>
                                    <span className="font-medium text-gray-900">₹ {bsData.assets.debtors.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 pl-4">
                                    <span className="font-medium text-gray-600">Cash-in-Hand</span>
                                    <span className="font-medium text-gray-900">₹ {bsData.assets.cash.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 pl-4">
                                    <span className="font-medium text-gray-600">Bank Accounts</span>
                                    <span className="font-medium text-gray-900">₹ {bsData.assets.bank.toLocaleString()}</span>
                                </div>
                                {/* Total */}
                                <div className="mt-6 p-4 bg-green-50 rounded-xl flex justify-between items-center">
                                    <span className="font-black text-green-900">TOTAL ASSETS</span>
                                    <span className="font-black text-lg text-green-900">₹ {bsData.totalAssets.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: TRIAL BALANCE */}
            {activeTab === 'tb' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Trial Balance</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10"
                            >
                                <Download size={16} /> Download PDF
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Particulars</th>
                                    <th className="px-6 py-4 text-right">Debit (Dr)</th>
                                    <th className="px-6 py-4 text-right">Credit (Cr)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-900">
                                {/* Sales Accounts */}
                                <tr className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">Sales Accounts</td>
                                    <td className="px-6 py-4 text-right">-</td>
                                    <td className="px-6 py-4 text-right">₹ {pnlData.revenue.toLocaleString()}</td>
                                </tr>
                                {/* Purchase Accounts */}
                                <tr className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">Purchase Accounts</td>
                                    <td className="px-6 py-4 text-right">₹ {pnlData.expenses.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">-</td>
                                </tr>
                                {/* Ledgers */}
                                {safeLedgers.map((l, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">{l.name} ({l.group})</td>
                                        <td className="px-6 py-4 text-right">
                                            {l.balance >= 0 && l.group === 'Sundry Debtors' ? `₹ ${l.balance.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {l.balance >= 0 && l.group === 'Sundry Creditors' ? `₹ ${l.balance.toLocaleString()}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {/* Cash & Bank */}
                                <tr className="bg-gray-50 font-bold">
                                    <td className="px-6 py-4">Cash & Bank Balances</td>
                                    <td className="px-6 py-4 text-right">
                                        ₹ {((dashboardImpact?.cash_balance || 0) + (dashboardImpact?.bank_balance || 0)).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
