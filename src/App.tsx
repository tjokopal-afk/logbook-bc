// =========================================
// APP ROOT - Role-Based Routing
// =========================================

import { Route, Routes, Navigate, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';
import { ROLES } from '@/utils/roleConfig';
import { getDefaultPath } from '@/utils/roleConfig';

// Intern Pages
import InternDashboard from '@/pages/intern/InternDashboard';
import MyActivities from '@/pages/intern/MyActivities';
import MyLogbook from '@/pages/intern/MyLogbook';
import MyProjects from '@/pages/intern/MyProjects';
import MyReviews from '@/pages/intern/MyReviews';
import StatusTask from '@/pages/intern/StatusTask';
import ProgressSaya from '@/pages/intern/ProgressSaya';
import StatusDanReview from '@/pages/intern/StatusDanReview';

// Mentor Pages
import MentorDashboard from '@/pages/mentor/MentorDashboard';
import ReviewLogbookSimple from '@/pages/mentor/ReviewLogbookSimple';
import ReviewLogbook from '@/pages/mentor/ReviewLogbook';
import ProgressIntern from '@/pages/mentor/ProgressIntern';
import KelolaTask from '@/pages/mentor/KelolaTask';
import InternSaya from '@/pages/mentor/InternSaya';
import BuatProyek from '@/pages/mentor/BuatProyek';
import KelolaProyek from '@/pages/mentor/KelolaProyek';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import KelolaUser from '@/pages/admin/KelolaUser';
import DataIntern from '@/pages/admin/DataIntern';
import KelolaProject from '@/pages/admin/KelolaProject';
import KelompokIntern from '@/pages/admin/KelompokIntern';
import Monitoring from '@/pages/admin/Monitoring';

// Superuser Pages
import SuperDashboard from '@/pages/superuser/SuperDashboard';
import SuperDashboardEnhanced from '@/pages/superuser/SuperDashboardEnhanced';
import AllUsers from '@/pages/superuser/AllUsers';
import AllProjects from '@/pages/superuser/AllProjects';
import AllLogbooks from '@/pages/superuser/AllLogbooks';
import AllReviews from '@/pages/superuser/AllReviews';
import AuditLog from '@/pages/superuser/AuditLog';
import SystemSettings from '@/pages/superuser/SystemSettings';
import DatabaseManagement from '@/pages/superuser/DatabaseManagement';
import RoleManagement from '@/pages/superuser/RoleManagement';
import SystemHealth from '@/pages/superuser/SystemHealth';
import StorageAnalytics from '@/pages/superuser/StorageAnalytics';
import PerformanceMetrics from '@/pages/superuser/PerformanceMetrics';

// Auth pages
import LoginPage from "./pages/auth/LoginPage";

// Other pages
import ProfilePage from "./pages/ProfilePage";
import DebugPage from "./pages/DebugPage";

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();

    // Removed orphaned session check - too aggressive
    // Session is now stable and persists across tab switches

    // Clean redirect logic
    useEffect(() => {
        // Don't redirect while loading
        if (loading) return;

        const isLoginPage = location.pathname === '/';
        const isDebugPage = location.pathname === '/debug';
        const hasAuth = user && profile;

        // Debug logging (disable in production)
        if (import.meta.env.DEV) {
            console.log('🔍 Redirect:', location.pathname, { hasAuth, loading });
        }

        // Debug page: always accessible
        if (isDebugPage) return;

        // Case 1: User logged in but on login page → redirect to dashboard
        if (hasAuth && isLoginPage) {
            const targetPath = getDefaultPath(profile.role);
            console.log('➡️ Redirecting to:', targetPath);
            navigate(targetPath, { replace: true });
            return;
        }

        // Case 2: No user but trying to access protected pages → redirect to login
        if (!hasAuth && !isLoginPage) {
            navigate('/', { replace: true });
            return;
        }
    }, [user, profile, loading, location.pathname, navigate]);

    // Show loading only during auth initialization
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <ToastProvider>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/debug" element={<DebugPage />} />

                {/* INTERN Routes - Updated per UI/UX recommendations */}
                <Route path="/intern" element={
                    <ProtectedRoute allowedRoles={[ROLES.INTERN]}>
                        <RoleBasedLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/intern/dashboard" replace />} />
                    <Route path="dashboard" element={<InternDashboard />} />
                    <Route path="aktivitas-saya" element={<MyActivities />} />
                    <Route path="laporan" element={<MyLogbook />} />
                    <Route path="status-dan-review" element={<StatusDanReview />} />
                    <Route path="project-saya" element={<MyProjects />} />
                    <Route path="progress-saya" element={<ProgressSaya />} />
                    
                    {/* Legacy route redirects for backward compatibility */}
                    <Route path="aktivitas" element={<Navigate to="/intern/aktivitas-saya" replace />} />
                    <Route path="my-logbook" element={<Navigate to="/intern/laporan" replace />} />
                    <Route path="my-projects" element={<Navigate to="/intern/project-saya" replace />} />
                    <Route path="status-task" element={<Navigate to="/intern/status-dan-review" replace />} />
                    <Route path="my-tasks" element={<Navigate to="/intern/status-dan-review" replace />} />
                    <Route path="review-rating" element={<Navigate to="/intern/status-dan-review" replace />} />
                    <Route path="my-reviews" element={<Navigate to="/intern/status-dan-review" replace />} />
                    <Route path="my-progress" element={<Navigate to="/intern/progress-saya" replace />} />
                </Route>

                {/* MENTOR Routes */}
                <Route path="/mentor" element={
                    <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
                        <RoleBasedLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/mentor/dashboard" replace />} />
                    <Route path="dashboard" element={<MentorDashboard />} />
                    <Route path="review-logbook" element={<ReviewLogbook />} />
                    <Route path="progress-intern" element={<ProgressIntern />} />
                    <Route path="intern-saya" element={<InternSaya />} />
                    <Route path="buat-proyek" element={<BuatProyek />} />
                    <Route path="kelola-proyek" element={<KelolaProyek />} />
                    
                    {/* Legacy route redirects */}
                    <Route path="project-saya" element={<Navigate to="/mentor/buat-proyek" replace />} />
                    <Route path="kelola-task" element={<Navigate to="/mentor/kelola-proyek" replace />} />
                    <Route path="intern-progress" element={<Navigate to="/mentor/progress-intern" replace />} />
                </Route>

                {/* ADMIN Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERUSER]}>
                        <RoleBasedLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="kelola-user" element={<KelolaUser />} />
                    <Route path="manage-users" element={<Navigate to="/admin/kelola-user" replace />} />
                    <Route path="data-intern" element={<DataIntern />} />
                    <Route path="kelola-project" element={<KelolaProject />} />
                    <Route path="manage-projects" element={<Navigate to="/admin/kelola-project" replace />} />
                    <Route path="kelompok-intern" element={<KelompokIntern />} />
                    <Route path="assign-partisipan" element={<Navigate to="/admin/kelompok-intern" replace />} />
                    <Route path="assign-participants" element={<Navigate to="/admin/kelompok-intern" replace />} />
                    <Route path="monitoring" element={<Monitoring />} />
                    <Route path="all-logbooks" element={<Navigate to="/admin/monitoring" replace />} />
                    <Route path="reports" element={<Navigate to="/admin/monitoring" replace />} />
                </Route>

                {/* SUPERUSER Routes - Enhanced God Mode */}
                <Route path="/super" element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPERUSER]}>
                        <RoleBasedLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/super/dashboard" replace />} />
                    <Route path="dashboard" element={<SuperDashboardEnhanced />} />
                    
                    {/* Full System Access */}
                    <Route path="all-users" element={<AllUsers />} />
                    <Route path="all-projects" element={<AllProjects />} />
                    <Route path="all-logbooks" element={<AllLogbooks />} />
                    <Route path="all-reviews" element={<AllReviews />} />
                    
                    {/* System Management */}
                    <Route path="audit-log" element={<AuditLog />} />
                    <Route path="system-settings" element={<SystemSettings />} />
                    <Route path="database" element={<DatabaseManagement />} />
                    <Route path="role-management" element={<RoleManagement />} />
                    
                    {/* Monitoring & Analytics */}
                    <Route path="system-health" element={<SystemHealth />} />
                    <Route path="storage-analytics" element={<StorageAnalytics />} />
                    <Route path="performance-metrics" element={<PerformanceMetrics />} />
                </Route>

                {/* Profile & Other Routes */}
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                } />
            </Routes>
        </ToastProvider>
    );
}

export default App;