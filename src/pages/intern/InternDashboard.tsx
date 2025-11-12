// =========================================
// INTERN DASHBOARD
// =========================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { InternProfileCard } from '@/components/intern/InternProfileCard';
import DashboardStats from '@/components/common/DashboardStats';
import QuickActions from '@/components/common/QuickActions';
import UpcomingDeadlines from '@/components/common/UpcomingDeadlines';
import RecentActivity from '@/components/common/RecentActivity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function InternDashboard() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile(); // Ensure current user profile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">📚 Intern Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-blue-600">{profile?.full_name}</span>!
            </p>
          </div>
        </div>
        <p className="text-lg font-medium text-blue-600 mt-3">
          🎯 Track your internship progress
        </p>
      </div>

      {/* Intern Profile Card with Real Data */}
      {profile && (
        <InternProfileCard 
          profile={profile}
          onEdit={() => navigate('/intern/profile')}
        />
      )}

      {/* Stats Grid - Intern View */}
      <DashboardStats role="intern" />

      {/* Quick Actions Widget */}
      <QuickActions role="intern" />

      {/* Widgets Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingDeadlines limit={5} />
        <RecentActivity limit={5} />
      </div>

      {/* Learning Resources */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Learning Resources</CardTitle>
          <CardDescription>Tips to maximize your internship experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>✓ Update your logbook daily for best results</li>
            <li>✓ Complete tasks before deadlines</li>
            <li>✓ Review mentor feedback regularly</li>
            <li>✓ Communicate proactively with your mentor</li>
            <li>✓ Track your progress and set personal goals</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
