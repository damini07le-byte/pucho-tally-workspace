import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AccountFlowProvider } from "./context/AccountFlowContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

import CardsGrid from "./pages/CardsGrid";
import Ledgers from "./pages/Ledgers";
import Vouchers from "./pages/Vouchers";
import SalesPurchase from "./pages/SalesPurchase";
import Banking from "./pages/Banking";
import GST from "./pages/GST";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// GUARD: Protects routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-pucho-purple animate-pulse">Loading Pucho OS...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <AccountFlowProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            {/* Admin Area */}
                            <Route path="/admin" element={
                                <ProtectedRoute>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }>
                                <Route index element={<CardsGrid />} />
                                <Route path="ledgers" element={<Ledgers />} />
                                <Route path="vouchers" element={<Vouchers />} />
                                <Route path="trade" element={<SalesPurchase />} />
                                <Route path="banking" element={<Banking />} />
                                <Route path="reports" element={<Reports />} />
                                <Route path="inventory" element={<Inventory />} />
                                <Route path="gst" element={<GST />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Routes>
                    </AccountFlowProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
