// =========================================
// AKTIVITAS PAGE - Input & Preview
// Design System Compliant v1.0
// =========================================

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityForm } from '@/components/dashboard/ActivityForm';
import { DraftEntriesTable } from '@/components/dashboard/DraftEntriesTable';
import { SaveWeeklyDialog } from '@/components/dashboard/SaveWeeklyDialog';
import { useDraftEntries } from '@/hooks/useLogbookEntries';
import { Save, Loader2 } from 'lucide-react';
import { WEEKLY_FEATURE_ENABLED } from '@/services/logbookService';

export default function DashboardPage() {
  const { data: draftEntries = [], isLoading, refetch } = useDraftEntries();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleFormSuccess = () => {
    refetch();
  };

  const handleSaveWeekly = () => {
    if (!WEEKLY_FEATURE_ENABLED) {
      alert('Fitur logbook mingguan saat ini dinonaktifkan.');
      return;
    }
    if (draftEntries.length === 0) {
      alert('Tidak ada draft entries untuk disimpan');
      return;
    }
    setShowSaveDialog(true);
  };

  const handleDialogClose = () => {
    setShowSaveDialog(false);
    refetch();
  };

  return (
    <DashboardLayout 
      title="Aktivitas Harian" 
      breadcrumb={[{ label: 'Aktivitas' }, { label: 'Input' }]}
    >
      {/* Main Content */}
      <div className="space-y-6">

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Input Aktivitas Harian</CardTitle>
            <CardDescription>
              Catat aktivitas harian Anda dengan detail waktu dan deskripsi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityForm onSuccess={handleFormSuccess} />
          </CardContent>
        </Card>

        {/* Draft Entries Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Preview Draft Entries</CardTitle>
              <CardDescription>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Memuat data...
                  </span>
                ) : draftEntries.length === 0 ? (
                  'Belum ada aktivitas yang dicatat'
                ) : (
                  `${draftEntries.length} aktivitas menunggu disimpan`
                )}
              </CardDescription>
            </div>
            {draftEntries.length > 0 && !isLoading && (
              <Button 
                onClick={handleSaveWeekly} 
                className="gap-2"
                disabled={!WEEKLY_FEATURE_ENABLED}
                title={!WEEKLY_FEATURE_ENABLED ? 'Fitur logbook mingguan dinonaktifkan' : undefined}
              >
                <Save className="h-4 w-4" />
                Simpan Logbook Mingguan
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <DraftEntriesTable
              entries={draftEntries}
              isLoading={isLoading}
              onEntryUpdated={refetch}
            />
          </CardContent>
        </Card>

        {/* Save Weekly Dialog */}
        {showSaveDialog && (
          <SaveWeeklyDialog
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            draftEntries={draftEntries}
            onSaved={handleDialogClose}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
