// =========================================
// APP ROOT - Flat-Able Style Routing
// =========================================

import { Route, Routes, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import HomePage from "./pages/HomePage";
import LoginPage from "./View/Login/page";
import DashboardPage from "./pages/DashboardPage";
import DataManagementPage from "./pages/DataManagementPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/toast';

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    // Optimized redirect logic - prevent loops
    useEffect(() => {
        // Don't redirect while loading
        if (loading) return;

        // Redirect logged-in users from login page to home (dashboard)
        if (user && location.pathname === '/') {
            navigate('/home', { replace: true });
            return;
        }

        // Redirect non-logged-in users to login page (except from login page)
        if (!user && location.pathname !== '/') {
            navigate('/', { replace: true });
        }
    }, [user, loading, location.pathname, navigate]);

    // Show loading only during auth initialization (handled in AuthContext)
    if (loading) {
        return null; // AuthContext already shows loading spinner
    }

    return (
        <ToastProvider>
            {/* Routes - No navbar, each page has DashboardLayout with Sidebar */}
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/data-management" element={<DataManagementPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </ToastProvider>
    );
}

export default App;