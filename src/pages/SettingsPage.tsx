// =========================================
// STATUS PAGE - Flat-Able Style
// =========================================

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout 
      title="Status" 
      breadcrumb={[{ label: 'Monitoring' }, { label: 'Status' }]}
    >
      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Status Magang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3>Coming Soon</h3>
              <p className="text-gray-600 mt-2">Fitur status magang akan segera tersedia</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
