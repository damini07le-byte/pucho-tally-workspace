import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AccountFlowContext = createContext();

export const AccountFlowProvider = ({ children }) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle');
    const [currentDoc, setCurrentDoc] = useState(null);
    const [webhookData, setWebhookData] = useState(() => {
        const saved = localStorage.getItem('pucho_webhookData');
        return saved ? (JSON.parse(saved) || null) : null;
    });
    const [uiVisibility, setUiVisibility] = useState(() => {
        const saved = localStorage.getItem('pucho_uiVisibility');
        return saved ? (JSON.parse(saved) || {
            accounting_dashboard: true,
            sales_purchase_tab: true,
            banking_tab: true,
            gst_tab: true,
            inventory_tab: true,
            vouchers_tab: true,
            ledgers_tab: true
        }) : {
            accounting_dashboard: true,
            sales_purchase_tab: true,
            banking_tab: true,
            gst_tab: true,
            inventory_tab: true,
            vouchers_tab: true,
            ledgers_tab: true
        };
    });
    const [dashboardImpact, setDashboardImpact] = useState(() => {
        const saved = localStorage.getItem('pucho_dashboardImpact');
        return saved ? (JSON.parse(saved) || {
            cash_balance: 0,
            bank_balance: 0,
            receivables: 0,
            payables: 0,
            gst_input: 0,
            gst_output: 0
        }) : {
            cash_balance: 0,
            bank_balance: 0,
            receivables: 0,
            payables: 0,
            gst_input: 0,
            gst_output: 0
        };
    });
    // --- DATA SANITIZATION HELPERS ---
    const sanitizeArray = (data, requiredKeys = []) => {
        if (!Array.isArray(data)) return [];
        return data.filter(item => {
            if (!item || typeof item !== 'object') return false;
            // Check if all required keys exist and are not null/undefined if specified
            return requiredKeys.every(key => item[key] !== undefined && item[key] !== null);
        });
    };

    // --- STATE INITIALIZATION WITH DEEP SANITIZATION ---
    const [postedVouchers, setPostedVouchers] = useState(() => {
        try {
            const saved = localStorage.getItem('pucho_postedVouchers');
            const parsed = saved ? JSON.parse(saved) : [];
            // Vouchers must have an ID
            return sanitizeArray(parsed, ['id']);
        } catch (e) { console.error("Corrupted postedVouchers", e); return []; }
    });

    const [bankStatements, setBankStatements] = useState(() => {
        try {
            const saved = localStorage.getItem('pucho_bankStatements');
            const parsed = saved ? JSON.parse(saved) : [];
            // Statements usually have an ID and a summary object
            return sanitizeArray(parsed, ['id']);
        } catch (e) { console.error("Corrupted bankStatements", e); return []; }
    });

    const [pendingVouchers, setPendingVouchers] = useState(() => {
        try {
            const saved = localStorage.getItem('pucho_pendingVouchers');
            const parsed = saved ? JSON.parse(saved) : [];
            return sanitizeArray(parsed, ['id']);
        } catch (e) { console.error("Corrupted pendingVouchers", e); return []; }
    });

    const [ledgers, setLedgers] = useState(() => {
        try {
            const saved = localStorage.getItem('pucho_ledgers');
            const parsed = saved ? JSON.parse(saved) : [];
            // Ledgers MUST have a name and a transactions array (even if empty)
            const cleaned = sanitizeArray(parsed, ['name']);
            return cleaned.map(l => ({
                ...l,
                transactions: Array.isArray(l.transactions) ? l.transactions : [],
                balance: parseFloat(l.balance) || 0
            }));
        } catch (e) { console.error("Corrupted ledgers", e); return []; }
    });

    const [companySettings, setCompanySettings] = useState(() => {
        const saved = localStorage.getItem('pucho_companySettings');
        return saved ? JSON.parse(saved) : {
            name: 'Pucho Global Solutions',
            gstin: '',
            address: '',
            email: 'admin@pucho.ai',
            phone: '',
            website: ''
        };
    });

    const [teamMembers, setTeamMembers] = useState(() => {
        const saved = localStorage.getItem('pucho_teamMembers');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Admin User', email: 'admin@pucho.ai', role: 'Admin', status: 'Active' },
            { id: 2, name: 'Rahul Sharma', email: 'rahul.acc@pucho.ai', role: 'Staff', status: 'Active' }
        ];
    });

    const [auditLogs, setAuditLogs] = useState(() => {
        const saved = localStorage.getItem('pucho_auditLogs');
        return saved ? JSON.parse(saved) : [
            { id: 1, action: 'System Initialized', user: 'System', time: new Date().toISOString(), type: 'info' }
        ];
    });

    const addAuditLog = useCallback((action, user = 'Admin', type = 'info') => {
        const newLog = {
            id: Date.now(),
            action,
            user,
            time: new Date().toISOString(),
            type
        };
        setAuditLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100
    }, []);

    // Helper to robustly parse various date formats (DD-MM-YYYY, YYYY-MM-DD, etc.)
    const parseDateToISO = (dateStr) => {
        if (!dateStr) return new Date().toISOString();
        if (dateStr.includes('T')) return dateStr; // Already ISO

        // Handle DD-MM-YYYY or DD/MM/YYYY
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) return dateStr; // Likely YYYY-MM-DD
            if (parts[2].length === 4) {
                // Return YYYY-MM-DD
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        try {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        } catch (e) {
            return new Date().toISOString();
        }
    };

    const addLedger = useCallback((ledgerData) => {
        setLedgers(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return [...safePrev, {
                ...ledgerData,
                balance: parseFloat(ledgerData.balance) || 0,
                status: 'Verified',
                transactions: []
            }];
        });
        addAuditLog(`New Ledger Created: ${ledgerData.name}`, 'Admin', 'action');
    }, [addAuditLog]);

    useEffect(() => {
        localStorage.setItem('pucho_auditLogs', JSON.stringify(auditLogs));
    }, [auditLogs]);

    const [portalData, setPortalData] = useState([]);

    const simulateGSTRFetch = useCallback(async () => {
        setStatus('fetching_portal');
        await new Promise(r => setTimeout(r, 2000)); // Simulate API delay

        // Helper to safely parse amounts (handles "1,200.00", "₹500", etc)
        const parseAmount = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            return parseFloat(val.toString().replace(/[^0-9.-]+/g, "")) || 0;
        };

        // Base data on current books to create realistic scenarios
        const safePostedVouchers = Array.isArray(postedVouchers) ? postedVouchers : [];
        const purchaseVouchers = safePostedVouchers.filter(v =>
            (v.type || '').toLowerCase().includes('purchase')
        );

        let mockPortalEntries = [];

        purchaseVouchers.forEach((v, index) => {
            if (!v || !v.id) return; // Skip invalid entries

            const scenario = Math.random();
            const realAmount = parseAmount(v.amount);

            if (scenario > 0.3) {
                // SCENARIO 1: EXACT MATCH (70%)
                mockPortalEntries.push({
                    id: `GSTR_${v.id}`,
                    invoice_no: v.id,
                    date: v.date || new Date().toISOString(),
                    party: v.party || 'Unknown',
                    gstin: v.details?.summary?.gstin || `29AAAAA${1000 + index}A1Z5`,
                    taxable: (realAmount * 0.82).toFixed(2),
                    tax: (realAmount * 0.18).toFixed(2),
                    total: realAmount,
                    status: 'Uploaded'
                });
            } else if (scenario > 0.1) {
                // SCENARIO 2: AMOUNT MISMATCH (20%)
                const diffAmount = realAmount + 10;
                mockPortalEntries.push({
                    id: `GSTR_${v.id}`,
                    invoice_no: v.id,
                    date: v.date || new Date().toISOString(),
                    party: v.party || 'Unknown',
                    gstin: v.details?.summary?.gstin || `29AAAAA${1000 + index}A1Z5`,
                    taxable: (diffAmount * 0.82).toFixed(2),
                    tax: (diffAmount * 0.18).toFixed(2),
                    total: diffAmount, // Mismatch!
                    status: 'Uploaded'
                });
            }
            // SCENARIO 3: MISSING IN PORTAL (10%) - We just don't add it to mockPortalEntries
        });

        // SCENARIO 4: ADDITIONAL IN PORTAL (Not in books)
        mockPortalEntries.push({
            id: `GSTR_EXTRA_1`,
            invoice_no: 'INV-9999',
            date: new Date().toISOString(),
            party: 'Unknown Vendor Services',
            gstin: '27ABCDE1234F1Z5',
            taxable: 5000.00,
            tax: 900.00,
            total: 5900.00,
            status: 'Uploaded'
        });

        setPortalData(mockPortalEntries);
        setStatus('idle');
    }, [postedVouchers]);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('pucho_companySettings', JSON.stringify(companySettings));
    }, [companySettings]);

    useEffect(() => {
        localStorage.setItem('pucho_teamMembers', JSON.stringify(teamMembers));
    }, [teamMembers]);

    // ... existing sync effects ...

    useEffect(() => {
        if (webhookData) {
            localStorage.setItem('pucho_webhookData', JSON.stringify(webhookData));
        } else {
            localStorage.removeItem('pucho_webhookData');
        }
    }, [webhookData]);

    useEffect(() => {
        localStorage.setItem('pucho_uiVisibility', JSON.stringify(uiVisibility));
    }, [uiVisibility]);

    useEffect(() => {
        localStorage.setItem('pucho_dashboardImpact', JSON.stringify(dashboardImpact));
        // Sync to Supabase
        const syncImpact = async () => {
            try {
                await supabase.from('dashboard_impact').upsert([{
                    id: 1,
                    ...dashboardImpact,
                    updated_at: new Date().toISOString()
                }]);
            } catch (e) {
                console.warn('Impact sync failed:', e);
            }
        };
        syncImpact();
    }, [dashboardImpact]);

    useEffect(() => {
        localStorage.setItem('pucho_postedVouchers', JSON.stringify(postedVouchers));
    }, [postedVouchers]);

    useEffect(() => {
        localStorage.setItem('pucho_bankStatements', JSON.stringify(bankStatements));
    }, [bankStatements]);

    useEffect(() => {
        localStorage.setItem('pucho_pendingVouchers', JSON.stringify(pendingVouchers));
    }, [pendingVouchers]);

    useEffect(() => {
        localStorage.setItem('pucho_ledgers', JSON.stringify(ledgers));
    }, [ledgers]);

    // Supabase Initial Fetch
    useEffect(() => {
        const fetchCloudData = async () => {
            try {
                const { data, error } = await supabase
                    .from('vouchers')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data && data.length > 0) {
                    console.log('Fetched Vouchers from Supabase:', data.length);
                    // Map back to our internal structure
                    const cloudPending = data.map(v => ({
                        id: v.voucher_id,
                        timestamp: v.created_at,
                        fileName: v.file_name,
                        fileData: v.file_data,
                        detected_type: v.type,
                        summary: v.summary,
                        status: v.status
                    }));

                    // Merge with local (prioritize cloud)
                    setPendingVouchers(prev => {
                        const safePrev = sanitizeArray(prev, ['id']);
                        const localIds = new Set(safePrev.map(p => p.id));
                        const uniqueCloud = cloudPending.filter(c => !localIds.has(c.id));
                        return [...uniqueCloud, ...safePrev];
                    });

                    // Update posted vouchers if they are approved
                    const cloudApproved = cloudPending
                        .filter(v => v.status === 'Approved')
                        .map(v => ({
                            ...v,
                            type: v.detected_type,
                            party: v.summary?.party || v.summary?.bank_name || 'Unknown',
                            amount: v.summary?.grand_total || v.summary?.balance || 0,
                            date: v.summary?.date || v.timestamp
                        }));

                    setPostedVouchers(prev => {
                        const safePrev = sanitizeArray(prev, ['id']);
                        const localIds = new Set(safePrev.map(p => p.id));
                        const uniqueApproved = cloudApproved.filter(c => !localIds.has(c.id));
                        return [...uniqueApproved, ...safePrev].map(v => ({
                            ...v,
                            date: parseDateToISO(v.summary?.date || v.date || v.timestamp)
                        }));
                    });

                    setBankStatements(prev => {
                        const safePrev = sanitizeArray(prev, ['id']);
                        const localIds = new Set(safePrev.map(p => p.id));
                        const uniqueCloud = cloudPending
                            .filter(v => v.detected_type === 'Bank Statement' && v.status === 'Approved')
                            .filter(c => !localIds.has(c.id));
                        return [...uniqueCloud, ...safePrev];
                    });

                    // Fetch Dashboard Impact
                    const { data: impactData } = await supabase
                        .from('dashboard_impact')
                        .select('*')
                        .eq('id', 1)
                        .single();

                    if (impactData) {
                        setDashboardImpact({
                            cash_balance: impactData.cash_balance,
                            bank_balance: impactData.bank_balance,
                            receivables: impactData.receivables,
                            payables: impactData.payables,
                            gst_input: impactData.gst_input,
                            gst_output: impactData.gst_output
                        });
                    }

                    // RECONSTRUCT LEDGERS FROM CLOUD DATA
                    setLedgers(prev => {
                        const safePrev = sanitizeArray(prev, ['name']);
                        const newLedgers = [...safePrev];
                        cloudApproved.forEach(v => {
                            const partyName = v.party;
                            if (!partyName || partyName === 'Unknown') return;

                            let ledger = newLedgers.find(l => l.name === partyName);
                            const amt = parseFloat(v.amount) || 0;
                            const isSales = (v.type || '').toLowerCase().includes('sales');

                            if (ledger) {
                                // Prevent duplicate transactions
                                const hasTx = (ledger.transactions || []).some(tx => tx.id === v.id);
                                if (!hasTx) {
                                    ledger.balance = isSales ? ledger.balance + amt : ledger.balance - amt;
                                    ledger.transactions = [{ date: v.date, id: v.id, amount: amt, type: v.type }, ...(ledger.transactions || [])];
                                }
                            } else {
                                newLedgers.push({
                                    name: partyName,
                                    group: isSales ? 'Sundry Debtors' : 'Sundry Creditors',
                                    balance: isSales ? amt : -amt,
                                    type: isSales ? 'Customer' : 'Vendor',
                                    status: 'Verified',
                                    transactions: [{ date: v.date, id: v.id, amount: amt, type: v.type }]
                                });
                            }
                        });
                        return newLedgers;
                    });
                }
            } catch (e) {
                console.warn('Initial Supabase fetch failed:', e.message);
            }
        };

        fetchCloudData();
    }, []);

    const processUpload = useCallback(async (file) => {
        if (!file) return;

        setStatus('uploading');
        setCurrentDoc(file);

        try {
            const formData = new FormData();
            const extension = file.name.split('.').pop().toLowerCase();
            let fileTypeShort = 'OTHER';
            if (['pdf'].includes(extension)) fileTypeShort = 'PDF';
            else if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(extension)) fileTypeShort = 'IMAGE';

            formData.append('file', file);
            formData.append('fileName', file.name);
            formData.append('extension', extension);
            formData.append('fileType', file.type);
            formData.append('file_type', fileTypeShort);
            formData.append('source', 'dashboard');

            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

            console.log('Sending file to Webhook:', file.name);
            const response = await fetch('https://studio.pucho.ai/api/v1/webhooks/y5HLui37U5lOvEO46yWDm', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(id);
            console.log('Response status:', response.status);

            if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);

            const text = await response.text();
            console.log('Raw result from webhook:', text);
            let result = {};
            if (text) {
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    console.warn('Webhook response not JSON:', text);
                    result = { body: { summary: {}, ui_visibility: {}, dashboard_impact: {} } };
                }
            }

            // Extract data from standard response format
            // Handle cases where body might be wrapped in 'fields' or is a string
            let data = result.body || result.fields?.body || result;

            if (typeof data === 'string' && data.trim().startsWith('{')) {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.warn('Webhook data string not valid JSON:', e);
                }
            }

            console.log('Extracted Data:', data);

            // Steps for UI feedback
            await new Promise(r => setTimeout(r, 800));
            setStatus('ocr');
            await new Promise(r => setTimeout(r, 800));
            setStatus('detecting');
            await new Promise(r => setTimeout(r, 800));
            setStatus('mapping');
            await new Promise(r => setTimeout(r, 800));
            setStatus('voucher_creation');

            console.log('Final Data Object:', data);

            // Convert to base64 for persistence
            const fileData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });

            // Update global state
            setWebhookData(data);
            if (data.ui_visibility) setUiVisibility(data.ui_visibility);
            if (data.dashboard_impact) setDashboardImpact(data.dashboard_impact);

            // Robust Detection for Banking vs Vouchers
            const hasBankKeyword = data.route_to === 'bank' || data.ui_route?.includes('activity');
            const hasBankTransactions = Array.isArray(data.summary?.bank_transactions) || Array.isArray(data.summary);
            const isBank = hasBankKeyword || (hasBankTransactions && !data.summary?.invoice_no);

            if (isBank) {
                console.log('Detected as BANKING data');
                const bankSummary = Array.isArray(data.summary) ? { bank_transactions: data.summary } : (data.summary || {});
                const transactions = bankSummary.bank_transactions || [];

                // Smart Balance Extraction: Try multiple fields, then try summing transactions
                const extractedBalance = parseFloat(bankSummary.balance || bankSummary.ending_balance || bankSummary.total_balance || data.dashboard_impact?.bank_balance || 0);

                let finalExtractedBalance = extractedBalance;
                if (finalExtractedBalance === 0 && transactions.length > 0) {
                    const opening = parseFloat(bankSummary.opening_balance || bankSummary.beginning_balance || bankSummary.start_balance || 0);
                    const credits = transactions.reduce((acc, tr) => acc + (parseFloat(tr.credit_amount || tr.credit || 0)), 0);
                    const debits = transactions.reduce((acc, tr) => acc + (parseFloat(tr.debit_amount || tr.debit || 0)), 0);
                    finalExtractedBalance = opening + credits - debits;
                }

                const newVoucher = {
                    id: `BANK_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    fileName: file.name,
                    fileObject: file,
                    fileData: fileData.length < 2000000 ? fileData : null,
                    detected_type: 'Bank Statement',
                    summary: {
                        ...bankSummary,
                        bank_transactions: transactions,
                        balance: finalExtractedBalance,
                        bank_name: bankSummary.bank_name || bankSummary.party || 'Bank Account',
                        account_number: bankSummary.account_number || '---'
                    },
                    dashboard_impact: data.dashboard_impact || {},
                    status: 'pending_review'
                };

                setPendingVouchers(prev => [newVoucher, ...prev]);

                // Sync to Supabase
                try {
                    await supabase.from('vouchers').insert([{
                        voucher_id: newVoucher.id,
                        type: newVoucher.detected_type,
                        party: newVoucher.summary.bank_name,
                        amount: newVoucher.summary.balance,
                        summary: newVoucher.summary,
                        status: 'pending_review',
                        file_name: file.name,
                        file_data: newVoucher.fileData
                    }]);
                } catch (e) {
                    console.warn('Supabase sync failed (Database might not be ready):', e);
                }

                // Check route inside try to suppress error if fails
                try {
                    if (!window.location.pathname.includes('vouchers')) {
                        navigate('/admin/vouchers');
                    }
                } catch (navErr) { console.warn('Navigation warning:', navErr); }

            } else {
                console.log('Detected as VOUCHER data');
                const newVoucher = {
                    id: data.summary?.invoice_no || `PENDING_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    fileName: file.name,
                    fileObject: file,
                    fileData: fileData.length < 2000000 ? fileData : null,
                    detected_type: data.detected_type || 'Manual',
                    summary: data.summary || {},
                    dashboard_impact: data.dashboard_impact || {},
                    status: 'pending_review'
                };

                setPendingVouchers(prev => [newVoucher, ...prev]);
                setStatus('pending_review');
                try {
                    await supabase.from('vouchers').insert([{
                        voucher_id: newVoucher.id,
                        type: newVoucher.detected_type,
                        party: newVoucher.summary?.party || 'Unknown',
                        amount: newVoucher.summary?.grand_total || 0,
                        summary: newVoucher.summary,
                        status: 'pending_review',
                        file_name: file.name,
                        file_data: newVoucher.fileData
                    }]);
                } catch (e) {
                    console.warn('Supabase sync failed:', e);
                }

                try {
                    if (!window.location.pathname.includes('vouchers')) {
                        navigate('/admin/vouchers');
                    }
                } catch (navErr) { console.warn('Navigation warning:', navErr); }
            }

            setStatus('pending_review');

            // Safe Redirection (if explicit route provided and not handled above)
            try {
                if (data.ui_route && typeof data.ui_route === 'string' && data.ui_route.includes('/') && !data.ui_route.includes('{{')) {
                    console.log('Explicit Redirecting to:', data.ui_route);
                    navigate(data.ui_route);
                }
            } catch (navErr) { console.warn('Explicit navigation warning:', navErr); }

        } catch (error) {
            console.error('Webhook Routing Error:', error);
            setStatus('error');
        }
    }, [webhookData]);

    const approveVoucher = useCallback(async (voucherId) => {
        const doc = pendingVouchers.find(v => v.id === voucherId);
        if (!doc) return;

        setStatus('posting');
        await new Promise(r => setTimeout(r, 1500));

        const summary = doc.summary || doc.details?.summary || {};
        const isBank = doc.detected_type?.includes('Bank');

        if (isBank) {
            // Post to Bank History
            setBankStatements(prev => [{
                ...doc,
                status: 'Approved'
            }, ...prev]);
        } else {
            // Universal Mapping
            const mappedVoucher = {
                ...doc,
                id: summary.invoice_no || doc.id,
                type: doc.detected_type || summary.type || 'Manual',
                date: parseDateToISO(summary.date || doc.timestamp || new Date().toISOString()),
                amount: summary.grand_total || summary.total_amount || summary.total || 0,
                party: summary.party || summary.vendor_name || summary.customer_name || 'Unknown',
                status: 'Approved',
                details: {
                    summary: summary,
                    items: summary.items || doc.details?.items || []
                }
            };

            setPostedVouchers(prev => [...prev, mappedVoucher]);

            // Update Ledger for Party
            setLedgers(prev => {
                const safePrev = Array.isArray(prev) ? prev : [];
                const partyName = mappedVoucher.party;
                if (!partyName || partyName === 'Unknown') return safePrev;
                const existing = safePrev.find(l => l.name === partyName);
                const amt = parseFloat(mappedVoucher.amount) || 0;
                const docType = (mappedVoucher.type || '').toLowerCase();
                const isSales = docType.includes('sales') || docType.includes('revenue');

                if (existing) {
                    return safePrev.map(l => l.name === partyName ? {
                        ...l,
                        balance: isSales ? l.balance + amt : l.balance - amt,
                        transactions: [{ date: mappedVoucher.date, id: mappedVoucher.id, amount: amt, type: mappedVoucher.type }, ...(l.transactions || [])]
                    } : l);
                } else {
                    return [...safePrev, {
                        name: partyName,
                        group: isSales ? 'Sundry Debtors' : 'Sundry Creditors',
                        balance: isSales ? amt : -amt,
                        type: isSales ? 'Customer' : 'Vendor',
                        status: 'Verified',
                        transactions: [{ date: mappedVoucher.date, id: mappedVoucher.id, amount: amt, type: mappedVoucher.type }]
                    }];
                }
            });
        }

        // Keep in queue but update status
        setPendingVouchers(prev => prev.map(v =>
            v.id === voucherId ? { ...v, status: 'Approved' } : v
        ));

        // Sync Approval to Supabase
        try {
            await supabase
                .from('vouchers')
                .update({ status: 'Approved' })
                .eq('voucher_id', voucherId);
        } catch (e) {
            console.warn('Supabase update failed:', e);
        }

        setStatus('posted');
    }, [pendingVouchers]);

    const exportToTally = useCallback((voucherId) => {
        const v = postedVouchers.find(doc => doc.id === voucherId);
        if (!v) return;

        const xml = `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE>
                    <VOUCHER VCHTYPE="${v.type}" ACTION="Create">
                        <DATE>${(v.date || '').replace(/-/g, '')}</DATE>
                        <PARTYLEDGERNAME>${v.party}</PARTYLEDGERNAME>
                        <VOUCHERNUMBER>${v.id}</VOUCHERNUMBER>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${v.party}</LEDGERNAME>
                            <AMOUNT>${(v.type || '').toLowerCase().includes('sales') ? -(v.amount || 0) : (v.amount || 0)}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`.trim();

        const blob = new Blob([xml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tally_Voucher_${v.id}.xml`;
        a.click();
    }, [postedVouchers]);

    const exportGSTR = useCallback((type, format = 'csv') => {
        const data = postedVouchers.filter(v =>
            type === 'GSTR-1' ? (v.type || '').toLowerCase().includes('sales') : (v.type || '').toLowerCase().includes('purchase')
        );

        if (data.length === 0) return alert(`No data available for ${type} export.`);

        if (format === 'json') {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_Export_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        } else {
            const headers = ["Invoice No", "Date", "Party Name", "GSTIN", "Taxable Value", "Tax Amount", "Total Amount"];
            const rows = data.map(inv => {
                // Clean and format date (YYYY-MM-DD)
                const rawDate = inv.date || new Date().toISOString();
                const formattedDate = rawDate.includes('T') ? rawDate.split('T')[0] : new Date(rawDate).toISOString().split('T')[0];

                return [
                    inv.id,
                    formattedDate,
                    inv.party || 'N/A',
                    inv.details?.summary?.gstin || 'N/A',
                    (inv.amount * 0.82).toFixed(2),
                    (inv.amount * 0.18).toFixed(2),
                    inv.amount
                ].map(val => `"${val.toString().replace(/"/g, '""')}"`); // Quote all fields
            });

            const csvContent = headers.map(h => `"${h}"`).join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_Export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        }
        addAuditLog(`${type} exported as ${format.toUpperCase()}`, 'Admin', 'action');
    }, [postedVouchers, addAuditLog]);

    const exportGSTR3B = useCallback(() => {
        let salesTax = 0;
        let purchaseTax = 0;
        let salesTaxable = 0;
        let purchaseTaxable = 0;

        postedVouchers.forEach(v => {
            const amt = parseFloat(v.amount) || 0;
            const tax = parseFloat(v.details?.summary?.tax_amount || 0);
            const type = (v.type || '').toLowerCase();
            if (type.includes('sales') || type.includes('revenue')) {
                salesTax += tax;
                salesTaxable += (amt - tax);
            } else {
                purchaseTax += tax;
                purchaseTaxable += (amt - tax);
            }
        });

        const gstr3bData = [
            ["GSTR-3B Summary Report", "", ""],
            ["Report Date:", new Date().toLocaleDateString(), ""],
            ["", "", ""],
            ["1. Outward Taxable Supplies (Sales)", "", ""],
            ["Total Taxable Value", "Total Tax", ""],
            [salesTaxable.toFixed(2), salesTax.toFixed(2), ""],
            ["", "", ""],
            ["2. Eligible ITC (Purchases)", "", ""],
            ["Total Taxable Value", "Total Tax (Credit)", ""],
            [purchaseTaxable.toFixed(2), purchaseTax.toFixed(2), ""],
            ["", "", ""],
            ["3. Net Tax Payable", (salesTax - purchaseTax).toFixed(2), ""]
        ];

        const csvContent = gstr3bData.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSTR-3B_Summary_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        addAuditLog(`GSTR-3B Summary Exported`, 'Admin', 'action');
    }, [postedVouchers, addAuditLog]);

    const clearData = useCallback(async () => {
        try {
            // 1. Reset Supabase Dashboard Impact
            await supabase.from('dashboard_impact').update({
                cash_balance: 0,
                bank_balance: 0,
                receivables: 0,
                payables: 0,
                gst_input: 0,
                gst_output: 0
            }).eq('id', 1);

            // 2. Delete all vouchers from Supabase
            // We use a filter that matches everything (neq to a non-existent value)
            await supabase.from('vouchers').delete().neq('voucher_id', '___NON_EXISTENT___');

            console.log("Cloud data successfully cleared");
        } catch (e) {
            console.warn('Failed to clear cloud data:', e);
        }

        // Local state reset
        setWebhookData(null);
        setStatus('idle');
        setCurrentDoc(null);
        setUiVisibility({
            accounting_dashboard: true,
            sales_purchase_tab: true,
            banking_tab: true,
            gst_tab: true,
            inventory_tab: true,
            vouchers_tab: true,
            ledgers_tab: true
        });
        setDashboardImpact({
            cash_balance: 0,
            bank_balance: 0,
            receivables: 0,
            payables: 0,
            gst_input: 0,
            gst_output: 0
        });
        setPostedVouchers([]);
        setBankStatements([]);
        setPendingVouchers([]);
        localStorage.clear();
        window.location.reload(); // Refresh to ensure clean state
    }, []);

    return (
        <AccountFlowContext.Provider value={{
            status,
            currentDoc,
            voucher: currentDoc, // Alias for Vouchers.jsx
            webhookData,
            uiVisibility,
            dashboardImpact,
            setDashboardImpact,
            postedVouchers,
            bankStatements,
            pendingVouchers,
            setPendingVouchers,
            ledgers,
            companySettings,
            setCompanySettings,
            teamMembers,
            setTeamMembers,
            portalData,
            auditLogs,
            addAuditLog,
            simulateGSTRFetch,
            processUpload,
            approveVoucher,
            addLedger,
            exportToTally,
            exportGSTR,
            exportGSTR3B,
            clearData
        }}>
            {children}
        </AccountFlowContext.Provider>
    );
};

export const useAccountFlow = () => {
    const context = useContext(AccountFlowContext);
    if (!context) {
        throw new Error('useAccountFlow must be used within an AccountFlowProvider');
    }
    return context;
};
