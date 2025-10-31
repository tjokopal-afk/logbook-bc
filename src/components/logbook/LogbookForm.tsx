// =========================================
// ACTIVITY FORM - INPUT AKTIVITAS COMPONENT
// Professional Material UI Style with Toast Notifications
// =========================================

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateEntry } from '@/hooks/useLogbookEntries';
import { useToast } from '@/components/ui/toast';
import { calculateDuration, getTodayDate, getNextDay } from '@/lib/utils/dateUtils';
import { Loader2 } from 'lucide-react';

interface ActivityFormProps {
  onSuccess?: () => void;
}

export function ActivityForm({ onSuccess }: ActivityFormProps) {
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    activity: '',
    start_time: '07:30',
    end_time: '17:00',
    description: '',
  });

  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createEntry = useCreateEntry();
  const { showToast } = useToast();

  // Auto-calculate duration when times change
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const calculated = calculateDuration(formData.start_time, formData.end_time);
      setDuration(calculated || '');
      
      // Clear time error if duration is valid
      if (calculated && errors.time) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.time;
          return newErrors;
        });
      }
    }
  }, [formData.start_time, formData.end_time]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.activity.trim()) {
      newErrors.activity = 'Aktivitas harus diisi';
      showToast({
        type: 'warning',
        title: 'Validasi Gagal',
        message: 'Aktivitas harus diisi',
      });
    }

    if (!formData.date) {
      newErrors.date = 'Tanggal harus diisi';
      showToast({
        type: 'warning',
        title: 'Validasi Gagal',
        message: 'Tanggal harus diisi',
      });
    }

    if (!duration) {
      newErrors.time = 'Jam selesai harus lebih besar dari jam mulai';
      showToast({
        type: 'warning',
        title: 'Validasi Gagal',
        message: 'Jam selesai harus lebih besar dari jam mulai',
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createEntry.mutateAsync(formData);
      
      // Show success notification
      showToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Aktivitas berhasil ditambahkan',
      });
      
      // Reset form and increment date
      setFormData({
        date: getNextDay(formData.date),
        activity: '',
        start_time: '07:30',
        end_time: '17:00',
        description: '',
      });

      setErrors({});

      // Focus on activity input for next entry
      setTimeout(() => {
        const activityInput = document.getElementById('activity');
        activityInput?.focus();
      }, 100);

      // Call success callback
      onSuccess?.();
    } catch (error) {
      console.error('Error creating entry:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Terjadi kesalahan saat menambahkan aktivitas';
      
      showToast({
        type: 'error',
        title: 'Gagal Menambahkan',
        message: errorMessage,
      });
      
      setErrors({ submit: errorMessage });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tanggal */}
        <div className="space-y-2">
          <Label htmlFor="date">
            Tanggal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className={errors.date ? 'border-red-500' : ''}
            required
          />
          {errors.date && (
            <p className="text-xs text-red-600">{errors.date}</p>
          )}
        </div>

        {/* Aktivitas */}
        <div className="space-y-2">
          <Label htmlFor="activity">
            Aktivitas <span className="text-red-500">*</span>
          </Label>
          <Input
            id="activity"
            type="text"
            placeholder="Contoh: Coding, Meeting, Testing"
            value={formData.activity}
            onChange={(e) => handleChange('activity', e.target.value)}
            className={errors.activity ? 'border-red-500' : ''}
            required
          />
          {errors.activity && (
            <p className="text-xs text-red-600">{errors.activity}</p>
          )}
        </div>

        {/* Jam Mulai */}
        <div className="space-y-2">
          <Label htmlFor="start_time">
            Jam Mulai <span className="text-red-500">*</span>
          </Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => handleChange('start_time', e.target.value)}
            className={errors.time ? 'border-red-500' : ''}
            required
          />
        </div>

        {/* Jam Selesai */}
        <div className="space-y-2">
          <Label htmlFor="end_time">
            Jam Selesai <span className="text-red-500">*</span>
          </Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => handleChange('end_time', e.target.value)}
            className={errors.time ? 'border-red-500' : ''}
            required
          />
          {errors.time && (
            <p className="text-xs text-red-600">{errors.time}</p>
          )}
        </div>
      </div>

      {/* Durasi (Read-only, auto-calculated) */}
      <div className="space-y-2">
        <Label htmlFor="duration">Durasi (otomatis)</Label>
        <Input
          id="duration"
          type="text"
          value={duration}
          readOnly
          className={`bg-gray-100 cursor-not-allowed ${duration ? 'text-green-700 font-medium' : 'text-gray-500'}`}
          placeholder="Akan terhitung otomatis"
        />
      </div>

      {/* Deskripsi */}
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi Aktivitas (Opsional)</Label>
        <textarea
          id="description"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Jelaskan detail aktivitas yang dilakukan..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={createEntry.isPending || !duration}
          className="min-w-[150px]"
        >
          {createEntry.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Tambah Aktivitas'
          )}
        </Button>
      </div>
    </form>
  );
}
