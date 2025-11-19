// =========================================
// EDIT LOGBOOK ENTRY DIALOG - Intern View
// Modal for editing rejected weekly logbook entries
// =========================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface LogbookEntry {
  id: string;
  entry_date: string;
  start_time: string;
  end_time: string;
  content: string;
  duration_minutes: number;
}

interface EditLogbookEntryDialogProps {
  entry: LogbookEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entryId: string, updates: Partial<LogbookEntry>) => Promise<void>;
}

export default function EditLogbookEntryDialog({
  entry,
  open,
  onOpenChange,
  onSave,
}: EditLogbookEntryDialogProps) {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    content: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form when entry changes
  useEffect(() => {
    if (entry) {
      const startHHMM = entry.start_time ? formatTimeToHHMM(entry.start_time) : '';
      const endHHMM = entry.end_time ? formatTimeToHHMM(entry.end_time) : '';
      
      setFormData({
        startTime: startHHMM,
        endTime: endHHMM,
        content: entry.content || '',
      });
      setErrors({});
    }
  }, [entry]);

  const formatTimeToHHMM = (timestamp: string): string => {
    try {
      const d = new Date(timestamp);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return '';
    }
  };

  const toISOWithOffset = (dateStr: string, hhmm: string): string => {
    const base = new Date(`${dateStr}T${hhmm}`);
    const offsetMin = -base.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    const offset = `${sign}${hh}:${mm}`;
    return `${dateStr}T${hhmm}:00${offset}`;
  };

  const calculateDuration = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.startTime) {
      newErrors.startTime = 'Waktu mulai harus diisi';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'Waktu selesai harus diisi';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Detail aktivitas harus diisi';
    }

    // Validate end time is after start time
    if (formData.startTime && formData.endTime) {
      const duration = calculateDuration(formData.startTime, formData.endTime);
      if (duration <= 0) {
        newErrors.endTime = 'Waktu selesai harus lebih besar dari waktu mulai';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!entry || !validateForm()) return;

    try {
      setSaving(true);

      const isoStart = toISOWithOffset(entry.entry_date, formData.startTime);
      const isoEnd = toISOWithOffset(entry.entry_date, formData.endTime);
      const duration = calculateDuration(formData.startTime, formData.endTime);

      await onSave(entry.id, {
        start_time: isoStart,
        end_time: isoEnd,
        content: formData.content.trim(),
        duration_minutes: duration,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      setErrors({ submit: 'Gagal menyimpan perubahan. Silakan coba lagi.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (saving) return;
    onOpenChange(false);
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Logbook Entry</DialogTitle>
          <DialogDescription>
            Edit entry untuk tanggal {entry.entry_date}. Pastikan semua informasi sudah benar sebelum menyimpan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Display */}
          <div>
            <Label>Tanggal</Label>
            <Input value={entry.entry_date} disabled className="bg-gray-50" />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">
                Waktu Mulai <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => {
                  setFormData({ ...formData, startTime: e.target.value });
                  setErrors({ ...errors, startTime: '', endTime: '' });
                }}
                className={errors.startTime ? 'border-red-500' : ''}
                disabled={saving}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.startTime}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="endTime">
                Waktu Selesai <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => {
                  setFormData({ ...formData, endTime: e.target.value });
                  setErrors({ ...errors, endTime: '' });
                }}
                className={errors.endTime ? 'border-red-500' : ''}
                disabled={saving}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {formData.startTime && formData.endTime && calculateDuration(formData.startTime, formData.endTime) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                Durasi: <span className="font-semibold">
                  {Math.floor(calculateDuration(formData.startTime, formData.endTime) / 60)} jam {calculateDuration(formData.startTime, formData.endTime) % 60} menit
                </span>
              </p>
            </div>
          )}

          {/* Content/Details */}
          <div>
            <Label htmlFor="content">
              Detail Aktivitas <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value });
                setErrors({ ...errors, content: '' });
              }}
              placeholder="Jelaskan secara detail apa yang dikerjakan..."
              className={`w-full min-h-[120px] border rounded-md p-3 ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={saving}
            />
            {errors.content && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.content}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
