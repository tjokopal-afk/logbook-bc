// =========================================
// SAVE WEEKLY DIALOG - Simpan Draft sebagai Logbook Mingguan
// =========================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/supabase';
import type { LogbookEntry } from '@/types/logbook.types';

interface SaveWeeklyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LogbookEntry[];
  onSuccess: () => void;
}

export function SaveWeeklyDialog({ isOpen, onClose, entries, onSuccess }: SaveWeeklyDialogProps) {
  const [weeklyName, setWeeklyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generate default name based on date range
  const generateDefaultName = () => {
    if (entries.length === 0) return '';
    
    const startDate = new Date(entries[0].entry_date);
    const endDate = new Date(entries[entries.length - 1].entry_date);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    };

    return `Logbook ${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = weeklyName.trim() || generateDefaultName();

    if (!name) {
      setError('Nama logbook harus diisi');
      return;
    }

    if (entries.length === 0) {
      setError('Tidak ada aktivitas untuk disimpan');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // For now, just mark entries with category 'weekly'
      // In future, add weekly_logbook_name column to database
      const { error: updateError } = await supabase
        .from('logbook_entries')
        .update({ 
          category: `weekly: ${name}`,
          updated_at: new Date().toISOString()
        })
        .in('id', entries.map(e => e.id));

      if (updateError) throw updateError;

      onSuccess();
      onClose();
      setWeeklyName('');
    } catch (err) {
      console.error('Error saving weekly logbook:', err);
      setError('Gagal menyimpan logbook mingguan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate summary
  const totalDuration = entries.reduce((sum, entry) => {
    const minutes = entry.duration_minutes || 0;
    return sum + (minutes / 60);
  }, 0);

  const startDate = entries.length > 0 ? new Date(entries[0].entry_date) : null;
  const endDate = entries.length > 0 ? new Date(entries[entries.length - 1].entry_date) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Simpan Logbook Mingguan</DialogTitle>
          <DialogDescription>
            Simpan semua draft aktivitas sebagai satu logbook mingguan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-blue-900 text-sm">Ringkasan</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-xs text-blue-600">Total Aktivitas</p>
                  <p className="font-semibold">{entries.length} aktivitas</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <div>
                  <p className="text-xs text-blue-600">Total Durasi</p>
                  <p className="font-semibold">{totalDuration.toFixed(1)} jam</p>
                </div>
              </div>
            </div>
            {startDate && endDate && (
              <div className="text-sm text-blue-800 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600 mb-1">Periode</p>
                <p className="font-medium">
                  {startDate.toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                  {' - '}
                  {endDate.toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="weekly-name">
              Nama Logbook Mingguan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="weekly-name"
              type="text"
              placeholder={generateDefaultName()}
              value={weeklyName}
              onChange={(e) => setWeeklyName(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Kosongkan untuk menggunakan nama otomatis
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Logbook'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
