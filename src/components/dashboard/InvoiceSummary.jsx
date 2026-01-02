import React from "react";

const InvoiceSummary = ({ summary }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-4">Invoice Summary</h2>
        <div className="grid grid-cols-2 gap-4">
            <p><strong>Date:</strong> {summary?.date || 'N/A'}</p>
            <p><strong>Party:</strong> {summary?.party || 'N/A'}</p>
            <p><strong>Invoice No:</strong> {summary?.invoice_no || 'N/A'}</p>
            <p><strong>Period:</strong> {summary?.invoice_period || 'N/A'}</p>
            <p><strong>Taxable Amount:</strong> ₹ {(summary?.taxable_amount || 0).toLocaleString()}</p>
            <p><strong>Tax Amount:</strong> ₹ {(summary?.tax_amount || 0).toLocaleString()}</p>
            <p className="col-span-2 font-bold">Grand Total: ₹ {(summary?.grand_total || 0).toLocaleString()}</p>
        </div>
    </div>
);

export default InvoiceSummary;
