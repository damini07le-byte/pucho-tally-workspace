import React, { useState } from "react";
import { useAccountFlow } from "../context/AccountFlowContext";
import {
    FileText, Clock, CheckCircle, AlertCircle,
    Zap, ShieldCheck, ExternalLink, ChevronDown,
    ChevronUp, Eye, Trash2, Receipt, ShoppingCart, Landmark
} from "lucide-react";
import InvoiceSummary from "../components/dashboard/InvoiceSummary";

const Vouchers = () => {
    const { status, pendingVouchers, approveVoucher, clearData } = useAccountFlow();
    const [expandedVoucherId, setExpandedVoucherId] = useState(null);

    // Filter statuses for the header
    const statusConfig = {
        idle: { label: "Waiting for Upload", icon: FileText, color: "text-gray-400", bg: "bg-gray-50" },
        uploading: { label: "Uploading...", icon: Zap, color: "text-blue-600", bg: "bg-blue-50 animate-pulse" },
        ocr: { label: "AI Reading Data...", icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50 animate-pulse" },
        pending_review: { label: "Pending Review", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        posting: { label: "Posting to Tally...", icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50 animate-pulse" },
        posted: { label: "Success", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        error: { label: "AI Failed", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" }
    };

    // Filter out Bank Statements (they belong in Banking tab)
    const safePendingVouchers = Array.isArray(pendingVouchers) ? pendingVouchers : [];
    const visibleVouchers = safePendingVouchers.filter(v =>
        !(v.detected_type || '').toLowerCase().includes('bank') &&
        !(v.detected_type || '').toLowerCase().includes('statement')
    );

    const currentStatus = statusConfig[status] || statusConfig.idle;
    const actualPendingCount = visibleVouchers.filter(v => v.status !== 'Approved').length;

    if (visibleVouchers.length === 0 && status === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] animate-fade-in">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 mb-6">
                    <FileText size={40} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">No Vouchers Pending</h2>
                <p className="text-gray-500 mt-2 max-w-sm text-center">Your cloud queue is empty. Upload sales or purchase documents to start AI extraction.</p>
                <button
                    onClick={() => document.getElementById('global-file-upload')?.click()}
                    className="mt-8 px-8 py-3 bg-black text-white rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                    <Zap size={18} className="text-yellow-400" /> Start Uploading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Queue Header */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Voucher Queue</h1>
                    <p className="text-sm text-gray-500 font-medium">{actualPendingCount} documents awaiting review</p>
                </div>
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${currentStatus.bg} ${currentStatus.color}`}>
                    <currentStatus.icon size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">{currentStatus.label}</span>
                </div>
            </div>

            {/* List of Vouchers */}
            <div className="space-y-4">
                {visibleVouchers.map((v) => (
                    <div key={v.id} className={`bg-white rounded-[24px] border transition-all duration-300 ${expandedVoucherId === v.id ? 'border-indigo-200 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-50' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                        {/* Horizontal Row */}
                        <div className="p-4 flex flex-col lg:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5 w-full lg:w-auto">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${v.detected_type?.toLowerCase().includes('sales') ? 'bg-green-50 text-green-600' :
                                    v.detected_type?.toLowerCase().includes('bank') ? 'bg-purple-50 text-purple-600' :
                                        'bg-blue-50 text-blue-600'}`}>
                                    {v.detected_type?.toLowerCase().includes('sales') ? <ShoppingCart size={22} /> :
                                        v.detected_type?.toLowerCase().includes('bank') ? <Landmark size={22} /> :
                                            <Receipt size={22} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{v.detected_type || 'Document'}</p>
                                    <p className="text-sm font-bold text-gray-900">{v.summary?.invoice_no || v.fileName}</p>
                                </div>
                                <div className="hidden md:block border-l border-gray-100 h-8 mx-2" />
                                <div className="hidden md:block">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{v.detected_type?.includes('Bank') ? 'Bank' : 'Party'}</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {v.detected_type?.includes('Bank')
                                            ? (v.summary?.bank_name || v.summary?.party || 'Bank Statement')
                                            : (v.summary?.party || v.summary?.buyer_name || v.fileName || 'N/A')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full lg:w-auto gap-8">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{v.detected_type?.includes('Bank') ? 'Balance' : 'Amount'}</p>
                                    <p className="text-lg font-black text-gray-900">
                                        ₹ {(() => {
                                            const bal = v.summary?.balance || v.summary?.grand_total || 0;
                                            if (bal === 0 && v.detected_type?.includes('Bank') && v.summary?.bank_transactions) {
                                                const opening = parseFloat(v.summary.opening_balance || v.summary.beginning_balance || v.summary.start_balance || 0);
                                                const credits = v.summary.bank_transactions.reduce((acc, tr) => acc + (parseFloat(tr.credit_amount || tr.credit || 0)), 0);
                                                const debits = v.summary.bank_transactions.reduce((acc, tr) => acc + (parseFloat(tr.debit_amount || tr.debit || 0)), 0);
                                                return (opening + credits - debits).toLocaleString();
                                            }
                                            return bal.toLocaleString();
                                        })()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {(v.fileObject || v.fileData) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                let blob = null;

                                                // Check if it's a real File/Blob (same session)
                                                if (v.fileObject instanceof File || v.fileObject instanceof Blob) {
                                                    blob = v.fileObject;
                                                }
                                                // Fallback if fileObject is just a POJO from localStorage or missing
                                                else if (v.fileData) {
                                                    try {
                                                        const byteString = atob(v.fileData.split(',')[1]);
                                                        const ab = new ArrayBuffer(byteString.length);
                                                        const ia = new Uint8Array(ab);
                                                        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                                                        const mimeMatch = v.fileData.match(/:(.*?);/);
                                                        blob = new Blob([ab], { type: mimeMatch ? mimeMatch[1] : 'application/octet-stream' });
                                                    } catch (err) {
                                                        console.error("Base64 decode failed:", err);
                                                    }
                                                }

                                                if (!blob) {
                                                    alert("Original file data is missing or too large for storage. Approval is still valid, but original download is disabled.");
                                                    return;
                                                }

                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = v.fileName || 'document';
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="p-2.5 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                                            title="Download Original"
                                        >
                                            <FileText size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setExpandedVoucherId(expandedVoucherId === v.id ? null : v.id)}
                                        className={`p-2.5 rounded-xl transition-all ${expandedVoucherId === v.id ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                                        title="View Details"
                                    >
                                        <Eye size={20} />
                                    </button>
                                    {v.status === 'Approved' ? (
                                        <div className="px-6 py-2.5 bg-green-50 text-green-600 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-2">
                                            <CheckCircle size={18} /> Approved
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => approveVoucher(v.id)}
                                            disabled={status === 'posting'}
                                            className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-indigo-600 shadow-lg shadow-black/5 hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
                                        >
                                            <ShieldCheck size={18} /> {status === 'posting' ? 'Posting...' : 'Approve'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Detail Section */}
                        {expandedVoucherId === v.id && (
                            <div className="border-t border-gray-50 p-6 bg-gray-50/30 animate-slide-up rounded-b-[24px]">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    {/* Simplified Summary */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                                            {v.detected_type?.includes('Bank') ? 'Statement Summary' : 'Metadata Summary'}
                                        </h3>
                                        <div className="space-y-3">
                                            {v.detected_type?.includes('Bank') ? (
                                                <>
                                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                                        <span className="text-sm text-gray-500">Bank Name</span>
                                                        <span className="text-sm font-bold">{v.summary?.bank_name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                                        <span className="text-sm text-gray-500">Account No</span>
                                                        <span className="text-sm font-bold">{v.summary?.account_number || '---'}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                                        <span className="text-sm text-gray-500">Last Transaction Date</span>
                                                        <span className="text-sm font-bold">{v.summary?.date || v.timestamp?.split('T')[0] || 'N/A'}</span>
                                                    </div>
                                                    <div className="pt-2 flex justify-between">
                                                        <span className="text-sm font-bold text-indigo-600">Closing Balance</span>
                                                        <span className="text-lg font-black text-indigo-600">
                                                            ₹ {(() => {
                                                                const bal = v.summary?.balance || 0;
                                                                if (bal === 0 && v.summary?.bank_transactions) {
                                                                    const opening = parseFloat(v.summary.opening_balance || v.summary.beginning_balance || v.summary.start_balance || 0);
                                                                    const credits = v.summary.bank_transactions.reduce((acc, tr) => acc + (parseFloat(tr.credit_amount || tr.credit || 0)), 0);
                                                                    const debits = v.summary.bank_transactions.reduce((acc, tr) => acc + (parseFloat(tr.debit_amount || tr.debit || 0)), 0);
                                                                    return (opening + credits - debits).toLocaleString();
                                                                }
                                                                return bal.toLocaleString();
                                                            })()}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                                        <span className="text-sm text-gray-500">Invoice Date</span>
                                                        <span className="text-sm font-bold">{v.summary?.date || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                                        <span className="text-sm text-gray-500">Taxable Amount</span>
                                                        <span className="text-sm font-bold">₹ {(v.summary?.taxable_amount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                                        <span className="text-sm text-gray-500">GST Total</span>
                                                        <span className="text-sm font-bold">₹ {(v.summary?.tax_amount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="pt-2 flex justify-between">
                                                        <span className="text-sm font-bold text-indigo-600">Grand Total</span>
                                                        <span className="text-lg font-black text-indigo-600">₹ {(v.summary?.grand_total || 0).toLocaleString()}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Line Items / Transactions Preview */}
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-sm">
                                        <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                                            {v.detected_type?.includes('Bank') ? 'Bank Transactions' : 'Line Items'} ({v.detected_type?.includes('Bank') ? (v.summary?.bank_transactions?.length || 0) : (v.summary?.items?.length || 0)})
                                        </div>
                                        <div className="max-h-[220px] overflow-y-auto">
                                            <table className="w-full text-left">
                                                <thead className="sticky top-0 bg-white shadow-sm">
                                                    <tr>
                                                        <th className="px-4 py-2 font-black text-gray-400 text-[10px] uppercase">
                                                            {v.detected_type?.includes('Bank') ? 'Description' : 'Desc'}
                                                        </th>
                                                        {v.detected_type?.includes('Bank') ? (
                                                            <>
                                                                <th className="px-4 py-2 font-black text-gray-400 text-[10px] uppercase text-right">Debit</th>
                                                                <th className="px-4 py-2 font-black text-gray-400 text-[10px] uppercase text-right">Credit</th>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <th className="px-4 py-2 font-black text-gray-400 text-[10px] uppercase text-right">Qty</th>
                                                                <th className="px-4 py-2 font-black text-gray-400 text-[10px] uppercase text-right">Total</th>
                                                            </>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {v.detected_type?.includes('Bank') ? (
                                                        (v.summary?.bank_transactions || []).map((tr, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-4 py-3 font-medium text-gray-700">{tr.description || tr.narration || 'Transaction'}</td>
                                                                <td className="px-4 py-3 text-right text-red-600 font-bold">
                                                                    {tr.debit_amount || tr.debit ? `₹${(tr.debit_amount || tr.debit).toLocaleString()}` : '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-green-600 font-bold">
                                                                    {tr.credit_amount || tr.credit ? `₹${(tr.credit_amount || tr.credit).toLocaleString()}` : '-'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        (v.summary?.items || []).map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-4 py-3 font-medium text-gray-700">{item.description}</td>
                                                                <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                                <td className="px-4 py-3 text-right font-bold text-gray-900">₹ {(item.amount || 0).toLocaleString()}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
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

export default Vouchers;
