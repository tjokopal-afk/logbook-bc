// =========================================
// SAVE WEEKLY DIALOG COMPONENT
// Optimized with better validation and UX
// =========================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveWeeklyLogbook } from '@/hooks/useLogbookEntries';
import { WEEKLY_FEATURE_ENABLED } from '@/services/logbookService';
import { generateDefaultWeekName } from '@/lib/utils/dateUtils';
import type { LogbookEntry } from '@/types/logbook.types';
import { Loader2, Save, X } from 'lucide-react';

interface SaveWeeklyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftEntries: LogbookEntry[];
  onSaved: () => void;
}

export function SaveWeeklyDialog({
  open,
  onOpenChange,
  draftEntries,
  onSaved,
}: SaveWeeklyDialogProps) {
  const [weekName, setWeekName] = useState('');
  const [error, setError] = useState('');
  const saveWeekly = useSaveWeeklyLogbook();

  // Generate default name based on first entry date
  const getDefaultName = () => {
    if (draftEntries.length > 0) {
      return generateDefaultWeekName(draftEntries[0].date, draftEntries[draftEntries.length - 1].date);
    }
    return generateDefaultWeekName(new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!WEEKLY_FEATURE_ENABLED) {
      setError('Fitur logbook mingguan saat ini dinonaktifkan.');
      return;
    }

    const finalWeekName = weekName.trim() || getDefaultName();

    if (!finalWeekName) {
      setError('Nama logbook mingguan harus diisi');
      return;
    }

    if (finalWeekName.length > 255) {
      setError('Nama terlalu panjang (maksimal 255 karakter)');
      return;
    }

    if (draftEntries.length === 0) {
      setError('Tidak ada draft entries untuk disimpan');
      return;
    }

    try {
      const entryIds = draftEntries.map((entry) => entry.id);
      await saveWeekly.mutateAsync({ weekName: finalWeekName, entryIds });

      setWeekName('');
      setError('');
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Error saving weekly logbook:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Gagal menyimpan logbook mingguan';
      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    setWeekName('');
    setError('');
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            💾 Simpan Logbook Mingguan
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={saveWeekly.isPending}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {(!WEEKLY_FEATURE_ENABLED || error) && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              {WEEKLY_FEATURE_ENABLED ? error : 'Fitur logbook mingguan saat ini dinonaktifkan karena skema database belum mendukung.'}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="weekName">
              Nama Logbook Mingguan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="weekName"
              type="text"
              placeholder={getDefaultName()}
              value={weekName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setWeekName(e.target.value);
                setError('');
              }}
              disabled={saveWeekly.isPending || !WEEKLY_FEATURE_ENABLED}
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Contoh: "Minggu 1 - Januari 2024" atau "Week 1 - Internship"
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>{draftEntries.length} aktivitas</strong> akan disimpan sebagai logbook mingguan.
              {draftEntries.length > 0 && (
                <>
                  <br />
                  <span className="text-xs mt-1 inline-block">
                    Periode: {draftEntries[draftEntries.length - 1].date} - {draftEntries[0].date}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saveWeekly.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saveWeekly.isPending || !WEEKLY_FEATURE_ENABLED}
              className="min-w-[120px]"
            >
              {saveWeekly.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
