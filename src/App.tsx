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
import MyLogbook from '@/pages/intern/MyLogbook';
import MyProjects from '@/pages/intern/MyProjects';
import StatusDanReview from '@/pages/intern/StatusDanReview';
import Timeline from '@/pages/intern/Timeline';

// Mentor Pages
import MentorDashboard from '@/pages/mentor/MentorDashboard';
import ReviewLogbookTable from '@/pages/mentor/ReviewLogbookTable';
import ProgressIntern from '@/pages/mentor/ProgressIntern';
import InternSaya from '@/pages/mentor/InternSaya';
import MentorMyProjects from '@/pages/mentor/MyProjects';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import KelolaUser from '@/pages/admin/KelolaUser';
import DataIntern from '@/pages/admin/DataIntern';
import KelolaProject from '@/pages/admin/KelolaProject';
import DivisiUser from '@/pages/admin/DivisiUser';
import Monitoring from '@/pages/admin/Monitoring';
import ManageBatch from '@/pages/admin/ManageBatch';

// Common Pages
import ProjectDetail from '@/pages/common/ProjectDetail';

// Superuser Pages
import SuperDashboard from '@/pages/superuser/SuperDashboard';
import AllUsers from '@/pages/superuser/AllUsers';
import AllProjects from '@/pages/superuser/AllProjects';
import AllLogbooks from '@/pages/superuser/AllLogbooks';
import AllReviews from '@/pages/superuser/AllReviews';
import ViewAllProjects from '@/pages/superuser/ViewAllProjects';

// Auth pages
import LoginPage from "./pages/auth/LoginPage";

// Other pages
import ProfilePage from "./pages/ProfilePage";
import DebugPage from "./pages/DebugPage";

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();

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
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="laporan" element={<MyLogbook />} />
                    <Route path="status-dan-review" element={<StatusDanReview />} />
                    <Route path="project-saya" element={<MyProjects />} />
                    <Route path="timeline" element={<Timeline />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    
                    {/* Legacy route redirects for backward compatibility */}
                    <Route path="aktivitas" element={<Navigate to="/intern/laporan" replace />} />
                    <Route path="my-logbook" element={<Navigate to="/intern/laporan" replace />} />
                    <Route path="my-projects" element={<Navigate to="/intern/project-saya" replace />} />
                    <Route path="status-task" element={<Navigate to="/intern/status-dan-review" replace />} />
                    <Route path="my-tasks" element={<Navigate to="/intern/status-dan-review" replace />} />
                    <Route path="review-rating" element={<Navigate to="/intern/status-dan-review" replace />} />
                    <Route path="my-reviews" element={<Navigate to="/intern/status-dan-review" replace />} />
                    <Route path="progress-saya" element={<Navigate to="/intern/timeline" replace />} />
                    <Route path="my-progress" element={<Navigate to="/intern/timeline" replace />} />
                </Route>

                {/* MENTOR Routes */}
                <Route path="/mentor" element={
                    <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
                        <RoleBasedLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/mentor/dashboard" replace />} />
                    <Route path="dashboard" element={<MentorDashboard />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="review-logbook" element={<ReviewLogbookTable />} />
                    <Route path="progress-intern" element={<ProgressIntern />} />
                    <Route path="intern-saya" element={<InternSaya />} />
                    <Route path="my-projects" element={<MentorMyProjects />} />
                    <Route path="projects" element={<MentorMyProjects />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    
                    {/* Legacy route redirects */}
                    <Route path="buat-proyek" element={<Navigate to="/mentor/my-projects" replace />} />
                    <Route path="kelola-proyek" element={<Navigate to="/mentor/my-projects" replace />} />
                    <Route path="project-saya" element={<Navigate to="/mentor/my-projects" replace />} />
                    <Route path="kelola-task" element={<Navigate to="/mentor/my-projects" replace />} />
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
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="kelola-user" element={<KelolaUser />} />
                    <Route path="kelola-user" element={<Navigate to="/admin/kelola-user" replace />} />
                    <Route path="data-intern" element={<DataIntern />} />
                    <Route path="kelola-project" element={<KelolaProject />} />
                    <Route path="projects" element={<KelolaProject />} />
                    <Route path="manajemen-batch" element={<ManageBatch />} />
                    <Route path="manage-projects" element={<Navigate to="/admin/kelola-project" replace />} />
                    <Route path="divisi-user" element={<DivisiUser />} />
                    <Route path="kelompok-intern" element={<Navigate to="/admin/divisi-user" replace />} />
                    <Route path="assign-partisipan" element={<Navigate to="/admin/divisi-user" replace />} />
                    <Route path="assign-participants" element={<Navigate to="/admin/divisi-user" replace />} />
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
                    <Route path="dashboard" element={<SuperDashboard />} />
                    
                    {/* Full System Access - Read-only projects */}
                    <Route path="all-users" element={<AllUsers />} />
                    <Route path="all-projects" element={<AllProjects />} />
                    <Route path="all-logbooks" element={<AllLogbooks />} />
                    <Route path="all-reviews" element={<AllReviews />} />
                    <Route path="projects" element={<ViewAllProjects />} />
                </Route>

                {/* Common Routes - Accessible by all authenticated users */}
                <Route path="/projects/:id" element={
                    <ProtectedRoute>
                        <ProjectDetail />
                    </ProtectedRoute>
                } />

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