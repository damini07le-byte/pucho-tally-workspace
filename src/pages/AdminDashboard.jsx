import React, { useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

const AdminDashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-pucho-light overflow-hidden font-sans text-gray-900">
            {/* Mobile Sidebar Overlay */}
            {/* Removed overlay to fix dimming issue */}

            {/* Sidebar: Responsive */}
            <div className="print:hidden">
                <Sidebar isMobileOpen={isSidebarOpen} setIsMobileOpen={setIsSidebarOpen} />
            </div>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col ml-0 lg:ml-[240px] overflow-hidden relative transition-all duration-300 print:ml-0 print:h-auto">
                {/* Header: Sticky Top */}
                <div className="print:hidden">
                    <Header onMenuClick={() => setIsSidebarOpen(true)} />
                </div>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-10 print:p-0 print:overflow-visible">
                    <div className="w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
