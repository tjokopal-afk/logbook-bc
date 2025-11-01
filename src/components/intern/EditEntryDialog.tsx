// =========================================
// EDIT ENTRY DIALOG - Edit Draft Aktivitas
// =========================================

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import type { LogbookEntry } from '@/types/logbook.types';

interface EditEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry: LogbookEntry;
  onSuccess: () => void;
}

export function EditEntryDialog({ isOpen, onClose, entry, onSuccess }: EditEntryDialogProps) {
  const [formData, setFormData] = useState({
    entry_date: entry.entry_date,
    content: entry.content,
    start_time: entry.start_time ? new Date(entry.start_time).toTimeString().slice(0, 5) : '08:00',
    end_time: entry.end_time ? new Date(entry.end_time).toTimeString().slice(0, 5) : '17:00',
  });

  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const calculated = calculateDuration(formData.start_time, formData.end_time);
      setDuration(calculated || '');
    }
  }, [formData.start_time, formData.end_time]);

  useEffect(() => {
    if (entry) {
      setFormData({
        entry_date: entry.entry_date,
        content: entry.content,
        start_time: entry.start_time ? new Date(entry.start_time).toTimeString().slice(0, 5) : '08:00',
        end_time: entry.end_time ? new Date(entry.end_time).toTimeString().slice(0, 5) : '17:00',
      });
    }
  }, [entry]);

  const calculateDuration = (start: string, end: string): string | null => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return null;
    }

    const diffMinutes = endMinutes - startMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!duration) {
      setError('Jam selesai harus lebih besar dari jam mulai');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const [startHour, startMin] = formData.start_time.split(':').map(Number);
      const [endHour, endMin] = formData.end_time.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      const { error: updateError } = await supabase
        .from('logbook_entries')
        .update({
          entry_date: formData.entry_date,
          content: formData.content,
          start_time: new Date(`${formData.entry_date}T${formData.start_time}:00`).toISOString(),
          end_time: new Date(`${formData.entry_date}T${formData.end_time}:00`).toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', entry.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Gagal mengupdate aktivitas. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Aktivitas</DialogTitle>
          <DialogDescription>
            Ubah detail aktivitas yang telah Anda catat
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Tanggal</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-activity">Aktivitas</Label>
              <textarea
                id="edit-activity"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                required
                placeholder="Contoh:&#10;- Coding API Backend&#10;- Meeting dengan tim&#10;&#10;Atau tulis satu aktivitas"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-start">Jam Mulai</Label>
              <Input
                id="edit-start"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end">Jam Selesai</Label>
              <Input
                id="edit-end"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Durasi (otomatis)</Label>
            <Input
              type="text"
              value={duration}
              readOnly
              className={`bg-gray-100 cursor-not-allowed ${duration ? 'text-green-700 font-medium' : 'text-gray-500'}`}
            />
          </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !duration}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
