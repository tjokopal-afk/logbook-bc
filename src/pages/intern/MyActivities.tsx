// =========================================
// MY ACTIVITIES PAGE - Input & Preview Draft
// Tab baru untuk input aktivitas harian
// =========================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityForm } from '@/components/intern/ActivityForm';
import { DraftEntriesTable } from '@/components/intern/DraftEntriesTable';
import { SaveWeeklyDialog } from '@/components/intern/SaveWeeklyDialog';
import { Button } from '@/components/ui/button';
import { Calendar, ListChecks, Save } from 'lucide-react';
import { supabase } from '@/supabase';
import type { LogbookEntry } from '@/types/logbook.types';

export default function MyActivities() {
  const { user } = useAuth();
  const [draftEntries, setDraftEntries] = useState<LogbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadDraftEntries();
    }
  }, [user]);

  const loadDraftEntries = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(50); // Limit to recent 50 entries

      if (error) throw error;
      setDraftEntries(data || []);
    } catch (error) {
      console.error('Error loading draft entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivityAdded = () => {
    loadDraftEntries();
  };

  const handleSaveWeekly = () => {
    setIsSaveDialogOpen(true);
  };

  const handleWeeklySaved = () => {
    setIsSaveDialogOpen(false);
    loadDraftEntries();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Aktivitas Harian</h1>
        <p className="text-muted-foreground mt-2">
          Catat aktivitas harian Anda dan simpan sebagai logbook mingguan
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="input" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Input Aktivitas
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Preview Draft ({draftEntries.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Input Aktivitas */}
        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Aktivitas Harian</CardTitle>
              <CardDescription>
                Isi form di bawah untuk mencatat aktivitas harian Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityForm onSuccess={handleActivityAdded} />
            </CardContent>
          </Card>

        </TabsContent>

        {/* Tab: Preview Draft */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Draft Aktivitas</CardTitle>
                <CardDescription>
                  Aktivitas yang belum disimpan sebagai logbook mingguan
                </CardDescription>
              </div>
              {draftEntries.length > 0 && (
                <Button 
                  onClick={handleSaveWeekly}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Logbook Mingguan
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <DraftEntriesTable 
                entries={draftEntries}
                isLoading={isLoading}
                onEntryUpdated={loadDraftEntries}
              />
            </CardContent>
          </Card>

          {/* Summary Card */}
          {draftEntries.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <ListChecks className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-1">Ringkasan Draft</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-green-700">Total Aktivitas</p>
                        <p className="text-2xl font-bold text-green-900">{draftEntries.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">Total Durasi</p>
                        <p className="text-2xl font-bold text-green-900">
                          {draftEntries.reduce((sum, entry) => {
                            const minutes = entry.duration_minutes || 0;
                            return sum + (minutes / 60);
                          }, 0).toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">Tanggal Awal</p>
                        <p className="text-sm font-semibold text-green-900">
                          {draftEntries[0]?.entry_date ? new Date(draftEntries[0].entry_date).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short' 
                          }) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">Tanggal Akhir</p>
                        <p className="text-sm font-semibold text-green-900">
                          {draftEntries[draftEntries.length - 1]?.entry_date ? new Date(draftEntries[draftEntries.length - 1].entry_date).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short' 
                          }) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Save Weekly Dialog */}
      <SaveWeeklyDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        entries={draftEntries}
        onSuccess={handleWeeklySaved}
      />
    </div>
  );
}
