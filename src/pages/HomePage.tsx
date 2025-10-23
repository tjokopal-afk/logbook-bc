// =========================================
// DASHBOARD PAGE - Overview & Statistics
// Enhanced Professional v2.0
// =========================================

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EnhancedStatCard } from '@/components/dashboard/EnhancedStatCard';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { useDraftEntries } from '@/hooks/useLogbookEntries';
import { CalendarDays, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { data: draftEntries = [] } = useDraftEntries();

  // Calculate statistics
  const totalActivities = draftEntries.length;
  const totalMinutes = draftEntries.reduce((sum, entry) => {
    if (entry.duration) {
      const [hours, minutes] = entry.duration.split(':').map(Number);
      return sum + (hours * 60) + (minutes || 0);
    }
    return sum;
  }, 0);
  const avgHoursPerDay = totalActivities > 0 ? (totalMinutes / totalActivities / 60).toFixed(1) : '0';

  return (
    <DashboardLayout 
      title="Dashboard" 
      breadcrumb={[{ label: 'Home' }, { label: 'Overview' }]}
    >
      {/* Row 1: Welcome Section (Moved to Top) */}
      <div className="mb-6">
        <WelcomeSection />
      </div>

      {/* Row 2: Enhanced Statistics - 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <EnhancedStatCard
          title="Total Aktivitas"
          value={totalActivities}
          icon={CalendarDays}
          color="green"
          trend={{ value: '+12%', isUp: true }}
        />
        <EnhancedStatCard
          title="Total Jam Kerja"
          value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
          icon={Clock}
          color="blue"
          subtitle="Jam kerja tercatat"
        />
        <EnhancedStatCard
          title="Rata-rata/Hari"
          value={`${avgHoursPerDay}h`}
          icon={TrendingUp}
          color="yellow"
          subtitle="Produktivitas harian"
        />
        <EnhancedStatCard
          title="Status"
          value={draftEntries.length > 0 ? 'Aktif' : 'Kosong'}
          icon={CheckCircle}
          color={draftEntries.length > 0 ? 'green' : 'purple'}
          subtitle={draftEntries.length > 0 ? 'Ada draft entries' : 'Belum ada data'}
        />
      </div>
    </DashboardLayout>
  );
}
