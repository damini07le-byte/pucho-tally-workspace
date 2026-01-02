import React from 'react';
import { FileText, Box, Shield, Settings } from 'lucide-react';

const PlaceholderPage = ({ title, icon: Icon, features }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                <Icon size={40} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-500 max-w-md mb-8">This module is currently processing live data from your Tally sync. AI features are being optimized.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
                {features.map((feature, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-left">
                        <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center mb-3">
                            <span className="text-xs font-bold">{i + 1}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.name}</h3>
                        <p className="text-xs text-gray-500">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const Reports = () => (
    <PlaceholderPage
        title="Financial Reports"
        icon={FileText}
        features={[
            { name: 'Trial Balance', desc: 'Real-time ledger balances' },
            { name: 'Profit & Loss', desc: 'Auto-calculated periodic result' },
            { name: 'Balance Sheet', desc: 'Detailed asset/liability view' },
            { name: 'Cash Flow', desc: 'Transactional liquidity analysis' }
        ]}
    />
);


export const Configuration = () => (
    <PlaceholderPage
        title="System Configuration"
        icon={Settings}
        features={[
            { name: 'Company Info', desc: 'Registration & GST details' },
            { name: 'Accounting Rules', desc: 'Voucher auto-naming rules' },
            { name: 'AI Automation', desc: 'Toggle OCR & Auto-posting' },
            { name: 'Users & Roles', desc: 'Access control management' }
        ]}
    />
);
