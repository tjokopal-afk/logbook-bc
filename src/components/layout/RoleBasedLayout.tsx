// =========================================
// ROLE-BASED LAYOUT
// =========================================

import { Outlet } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from './DashboardLayout';

export default function RoleBasedLayout() {
  const { profile, loading } = useAuth();

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

  if (!profile) {
    return null;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
