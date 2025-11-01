// =========================================
// ACTIVITY FORM - Input Aktivitas Harian
// =========================================

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';

interface ActivityFormProps {
  onSuccess?: () => void;
}

export function ActivityForm({ onSuccess }: ActivityFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    content: '',
    start_time: '08:00',
    end_time: '17:00',
    category: 'daily task',
  });

  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate duration when times change
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const calculated = calculateDuration(formData.start_time, formData.end_time);
      setDuration(calculated || '');
      
      if (calculated && errors.time) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.time;
          return newErrors;
        });
      }
    }
  }, [formData.start_time, formData.end_time]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.content.trim()) {
      newErrors.content = 'Aktivitas harus diisi';
    }

    if (!formData.entry_date) {
      newErrors.entry_date = 'Tanggal harus diisi';
    }

    if (!duration) {
      newErrors.time = 'Jam selesai harus lebih besar dari jam mulai';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate duration in minutes
      const [startHour, startMin] = formData.start_time.split(':').map(Number);
      const [endHour, endMin] = formData.end_time.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      const { error } = await supabase
        .from('logbook_entries')
        .insert({
          user_id: user.id,
          entry_date: formData.entry_date,
          content: formData.content,
          start_time: new Date(`${formData.entry_date}T${formData.start_time}:00`).toISOString(),
          end_time: new Date(`${formData.entry_date}T${formData.end_time}:00`).toISOString(),
          duration_minutes: durationMinutes,
          category: formData.category,
        });

      if (error) throw error;

      // Reset form and increment date
      const nextDate = new Date(formData.entry_date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      setFormData({
        entry_date: nextDate.toISOString().split('T')[0],
        content: '',
        start_time: '08:00',
        end_time: '17:00',
        category: 'daily task',
      });

      setErrors({});

      // Focus on content input
      setTimeout(() => {
        document.getElementById('content')?.focus();
      }, 100);

      onSuccess?.();
    } catch (error) {
      console.error('Error creating entry:', error);
      setErrors({ submit: 'Gagal menambahkan aktivitas. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
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
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{errors.submit}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tanggal */}
        <div className="space-y-2">
          <Label htmlFor="entry_date">
            Tanggal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="entry_date"
            type="date"
            value={formData.entry_date}
            onChange={(e) => handleChange('entry_date', e.target.value)}
            className={errors.entry_date ? 'border-red-500' : ''}
            required
          />
          {errors.entry_date && (
            <p className="text-xs text-red-600">{errors.entry_date}</p>
          )}
        </div>

        {/* Aktivitas */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="content">
            Aktivitas <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="content"
            className="flex min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            placeholder="Contoh:&#10;- Coding API Backend&#10;- Meeting dengan tim&#10;- Testing fitur login&#10;- Review code&#10;- Dokumentasi&#10;&#10;Atau tulis satu aktivitas utama"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={8}
            required
          />
          {errors.content && (
            <p className="text-xs text-red-600">{errors.content}</p>
          )}
          <p className="text-xs text-gray-500">
            Tip: Gunakan bullet point (-) untuk list aktivitas atau tulis satu aktivitas utama
          </p>
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

      {/* Durasi (Read-only) */}
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

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !duration}
          className="min-w-[150px] bg-[#6B8E23] hover:bg-[#556B2F]"
        >
          {isSubmitting ? (
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
