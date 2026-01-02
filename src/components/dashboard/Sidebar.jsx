import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/pucho_logo_sidebar_v2.png';
import { useAccountFlow } from '../../context/AccountFlowContext';

// Lucide Icon Imports
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    ShoppingCart,
    Landmark,
    BarChart3,
    Boxes,
    ReceiptIndianRupee,
    Settings,
    LogOut,
    Database,
    Zap
} from 'lucide-react';

import LogoutIcon from '../../assets/icons/logout.svg';

const Sidebar = ({ isMobileOpen }) => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { uiVisibility } = useAccountFlow();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Suvit-style Module Groupings
    const menuGroups = [
        {
            title: 'CORE MODULES',
            items: [
                { name: 'Dashboard', icon: LayoutDashboard, path: '/admin', visible: true },
                { name: 'Configuration', icon: Settings, path: '/admin/settings', visible: true },
            ]
        },
        {
            title: 'AUTOMATION',
            items: [
                { name: 'Cloud Vouchers', icon: Zap, path: '/admin/vouchers', visible: true },
                { name: 'Trade Register', icon: ShoppingCart, path: '/admin/trade', visible: true },
                { name: 'Banking Docs', icon: Landmark, path: '/admin/banking', visible: true },
                { name: 'GST Center', icon: ReceiptIndianRupee, path: '/admin/gst', visible: true },
            ]
        },
        {
            title: 'ACCOUNTING',
            items: [
                { name: 'Ledgers', icon: BookOpen, path: '/admin/ledgers', visible: uiVisibility?.ledgers_tab !== false },
                { name: 'Inventory', icon: Boxes, path: '/admin/inventory', visible: uiVisibility?.inventory_tab !== false },
                { name: 'Financial Reports', icon: BarChart3, path: '/admin/reports', visible: true },
            ]
        }
    ];

    return (
        <aside
            className={`
                w-[240px] h-screen bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 left-0 z-30
                transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            {/* Logo */}
            <div className="pl-3 pt-3 pb-2">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Pucho" className="h-[34px] w-auto" />
                </div>
            </div>

            {/* Navigation Areas */}
            <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-2">
                        <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none opacity-60">
                            {group.title}
                        </p>
                        <nav className="space-y-1">
                            {group.items.filter(item => item.visible).map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center gap-[10px] px-[12px] h-[40px] rounded-[12px] text-[13px] font-bold transition-all duration-200 border
                                        ${isActive
                                            ? 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm shadow-indigo-50'
                                            : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon className="w-4 h-4" />
                                            <span className="truncate">{item.name}</span>
                                            {isActive && <div className="ml-auto w-1 h-1 bg-indigo-600 rounded-full" />}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                ))}
            </div>

            {/* User Profile (Bottom) */}
            <div className="p-4 border-t border-gray-100 space-y-3">
                <div
                    onClick={() => navigate('/admin/settings')}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                >
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-xs font-black">
                        {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-900 truncate">{user?.full_name || 'Admin User'}</p>
                        <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-tighter">{user?.role || 'Administrator'}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-bold text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut size={18} />
                    <span className="truncate">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
