import React, { useMemo } from 'react';
import { ShieldCheck, FileSpreadsheet, AlertCircle, ArrowUpRight, ArrowDownLeft, ReceiptIndianRupee, Scale, Download, FileJson } from 'lucide-react';
import { useAccountFlow } from '../context/AccountFlowContext';

const GST = () => {
    const { postedVouchers, dashboardImpact, portalData, simulateGSTRFetch, exportGSTR, exportGSTR3B } = useAccountFlow();

    // Safe Wrappers
    const safePostedVouchers = Array.isArray(postedVouchers) ? postedVouchers : [];
    const safePortalData = Array.isArray(portalData) ? portalData : [];
    const safeDashboardImpact = dashboardImpact || {};

    // Matching Algorithm
    const reconciliationData = useMemo(() => {
        if (!safePortalData.length) return [];

        const books = safePostedVouchers.filter(v => (v.type || '').toLowerCase().includes('purchase'));
        const combined = new Map();

        // 1. Map Books Data
        books.forEach(b => {
            combined.set(b.id, {
                invoice_no: b.id,
                party: b.party,
                bookAmount: parseFloat(b.amount || 0),
                portalAmount: 0,
                status: 'Missing in Portal'
            });
        });

        // 2. Map/Match Portal Data
        safePortalData.forEach(p => {
            const id = p.invoice_no;
            const pAmt = parseFloat(p.total || 0);

            if (combined.has(id)) {
                const existing = combined.get(id);
                const diff = Math.abs(existing.bookAmount - pAmt);
                combined.set(id, {
                    ...existing,
                    portalAmount: pAmt,
                    status: diff < 1 ? 'Matched' : 'Mismatch',
                    diff: existing.bookAmount - pAmt
                });
            } else {
                combined.set(id, {
                    invoice_no: id,
                    party: p.party,
                    bookAmount: 0,
                    portalAmount: pAmt,
                    status: 'Missing in Books',
                    diff: -pAmt
                });
            }
        });

        return Array.from(combined.values());
    }, [safePostedVouchers, safePortalData]);

    const gstBreakdown = useMemo(() => {
        let output = 0;
        let input = 0;

        safePostedVouchers.forEach(v => {
            const tax = parseFloat(v.details?.summary?.tax_amount || 0);
            if (v.type?.toLowerCase().includes('sales')) {
                output += tax;
            } else if (v.type?.toLowerCase().includes('purchase')) {
                input += tax;
            }
        });

        // Use impact as fallback if no vouchers posted yet
        const finalOutput = output || safeDashboardImpact.gst_output || 0;
        const finalInput = input || safeDashboardImpact.gst_input || 0;

        return {
            output: finalOutput,
            input: finalInput,
            payable: Math.max(0, finalOutput - finalInput),
            cgst: finalOutput * 0.5,
            sgst: finalOutput * 0.5,
            igst: 0,
            status: finalOutput > 0 ? 'Action Required' : 'Compliant'
        };
    }, [safePostedVouchers, safeDashboardImpact]);

    const stats = [
        { label: 'GST Output (Sales)', value: `₹ ${gstBreakdown.output.toLocaleString()}`, icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'GST Input (ITC)', value: `₹ ${gstBreakdown.input.toLocaleString()}`, icon: ArrowDownLeft, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Net Tax Payable', value: `₹ ${gstBreakdown.payable.toLocaleString()}`, icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* GST Filing Header */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                        <ReceiptIndianRupee size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">GST Compliance Center</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">GSTR-1 & GSTR-3B PREVIEW</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 px-6 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Return Period</p>
                        <p className="text-sm font-bold text-gray-900">
                            {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center text-amber-600">
                        <p className="text-[10px] font-black uppercase">Due in</p>
                        <p className="text-sm font-bold">
                            {(() => {
                                const today = new Date();
                                const dueDay = 20; // Assuming GSTR-3B due date
                                const daysLeft = dueDay - today.getDate();
                                return daysLeft > 0 ? `${daysLeft} Days` : 'Due Today';
                            })()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2 md:mb-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                            <div className={`p-1.5 md:p-2 rounded-xl ${s.bg} ${s.color}`}>
                                <s.icon size={16} />
                            </div>
                        </div>
                        <h2 className={`text-xl md:text-2xl font-black ${s.color}`}>{s.value}</h2>
                    </div>
                ))}
            </div>

            {/* Export Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">GSTR-1 (Sales)</p>
                            <p className="text-sm font-bold text-gray-900 border-b border-gray-100">Prepare for Filing</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportGSTR('GSTR-1', 'csv')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black hover:bg-black hover:text-white transition-all border border-gray-100"
                        >
                            <Download size={14} /> CSV
                        </button>
                        <button
                            onClick={() => exportGSTR('GSTR-1', 'json')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black hover:bg-black hover:text-white transition-all border border-gray-100"
                        >
                            <FileJson size={14} /> JSON
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                            <Scale size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">GSTR-2A (Purchase)</p>
                            <p className="text-sm font-bold text-gray-900 border-b border-gray-100">ITC Reconciliation</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportGSTR('GSTR-2A', 'csv')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black hover:bg-black hover:text-white transition-all border border-gray-100"
                        >
                            <Download size={14} /> CSV
                        </button>
                        <button
                            onClick={() => exportGSTR('GSTR-2A', 'json')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black hover:bg-black hover:text-white transition-all border border-gray-100"
                        >
                            <FileJson size={14} /> JSON
                        </button>
                    </div>
                </div>
            </div>

            {/* Reconciliation Section */}
            {!safePortalData.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tax Breakdown Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/20 flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tax Component Breakdown</h3>
                            <ShieldCheck size={18} className="text-green-500" />
                        </div>
                        <div className="p-6 space-y-6">
                            {[
                                { label: 'CGST (Central Tax)', value: gstBreakdown.cgst, color: 'bg-blue-500' },
                                { label: 'SGST (State Tax)', value: gstBreakdown.sgst, color: 'bg-purple-500' },
                                { label: 'IGST (Integrated Tax)', value: gstBreakdown.igst, color: 'bg-amber-500' },
                            ].map((tax, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-gray-600">{tax.label}</span>
                                        <span className="text-sm font-black text-gray-900">₹ {tax.value.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`${tax.color} h-full rounded-full transition-all duration-1000`}
                                            style={{ width: `${tax.value > 0 ? 50 : 2}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GSTR Filing Status (Initial) */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border border-amber-100 animate-pulse-subtle">
                            <AlertCircle size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 italic">Reconciliation Pending</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                                Please verify <span className="text-gray-900 font-bold underline">GSTR-2B</span> data from Portal to finalize ITC entries for this month.
                            </p>
                        </div>
                        <button
                            onClick={simulateGSTRFetch}
                            className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                        >
                            <FileSpreadsheet size={20} /> Fetch & Match GSTR-2B
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Reconciliation Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Invoices</p>
                            <h3 className="text-2xl font-black text-gray-900">{reconciliationData.length}</h3>
                        </div>
                        <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Matched</p>
                            <h3 className="text-2xl font-black text-green-700">{reconciliationData.filter(d => d.status === 'Matched').length}</h3>
                        </div>
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Mismatch</p>
                            <h3 className="text-2xl font-black text-red-700">{reconciliationData.filter(d => d.status === 'Mismatch').length}</h3>
                        </div>
                        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Missing</p>
                            <h3 className="text-2xl font-black text-amber-700">{reconciliationData.filter(d => d.status.includes('Missing')).length}</h3>
                        </div>
                    </div>

                    {/* Detailed Comparison Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/20 flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">GSTR-2B Reconciliation (Books vs Portal)</h3>
                            <button onClick={simulateGSTRFetch} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                <ArrowUpRight size={14} /> Refresh
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Invoice No</th>
                                        <th className="px-6 py-4">Party Name</th>
                                        <th className="px-6 py-4 text-right">Books (Tally)</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Portal (GSTR-2B)</th>
                                        <th className="px-6 py-4">Tax Difference</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {reconciliationData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{row.invoice_no}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600">{row.party}</td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {row.bookAmount ? `₹ ${row.bookAmount.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase inline-flex items-center gap-1
                                                    ${row.status === 'Matched' ? 'bg-green-100 text-green-700' :
                                                        row.status === 'Mismatch' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {row.status === 'Matched' ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-500">
                                                {row.portalAmount ? `₹ ${row.portalAmount.toLocaleString()}` : '-'}
                                            </td>
                                            <td className={`px-6 py-4 text-sm font-bold ${row.diff !== 0 ? 'text-red-600' : 'text-gray-300'}`}>
                                                {row.diff !== 0 ? `₹ ${row.diff.toFixed(2)}` : '0.00'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Logs */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/20">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Compliance Audit Log</h3>
                </div>
                <div className="p-6 text-center text-gray-400 italic text-sm">
                    {safePostedVouchers.length > 0
                        ? "Audit logs reflect data from the last sync with GSTR portal."
                        : "No compliance issues detected in processed documents."
                    }
                </div>
            </div>
        </div>
    );
};

export default GST;
