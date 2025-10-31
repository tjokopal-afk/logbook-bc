// =========================================
// EDIT ENTRY DIALOG - Professional Material UI Style
// =========================================

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpdateEntry } from '@/hooks/useLogbookEntries'
import { useToast } from '@/components/ui/toast'
import type { LogbookEntry } from '@/types/logbook.types'
import { Loader2 } from 'lucide-react'

interface EditEntryDialogProps {
  entry: LogbookEntry | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditEntryDialog({ entry, isOpen, onClose, onSuccess }: EditEntryDialogProps) {
  const updateEntry = useUpdateEntry()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    date: '',
    activity: '',
    start_time: '',
    end_time: '',
    description: '',
  })

  // Populate form when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date || '',
        activity: entry.activity || '',
        start_time: entry.start_time || '',
        end_time: entry.end_time || '',
        description: entry.description || '',
      })
    }
  }, [entry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry) return

    // Validation
    if (!formData.activity.trim()) {
      showToast({
        type: 'warning',
        title: 'Validasi Gagal',
        message: 'Aktivitas harus diisi',
      })
      return
    }

    if (!formData.date) {
      showToast({
        type: 'warning',
        title: 'Validasi Gagal',
        message: 'Tanggal harus diisi',
      })
      return
    }

    if (!formData.start_time || !formData.end_time) {
      showToast({
        type: 'warning',
        title: 'Validasi Gagal',
        message: 'Waktu mulai dan selesai harus diisi',
      })
      return
    }

    try {
      setIsSubmitting(true)

      await updateEntry.mutateAsync({
        id: entry.id!,
        updates: {
          date: formData.date,
          activity: formData.activity.trim(),
          start_time: formData.start_time,
          end_time: formData.end_time,
          description: formData.description.trim() || undefined,
        },
      })

      showToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Aktivitas berhasil diperbarui',
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating entry:', error)
      showToast({
        type: 'error',
        title: 'Gagal Memperbarui',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui aktivitas',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-brand-black font-franklin-black text-xl">
            Edit Aktivitas Harian
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Perbarui informasi aktivitas Anda di bawah ini
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="edit-date" className="text-sm font-semibold text-gray-700">
              Tanggal <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Activity */}
          <div className="space-y-2">
            <Label htmlFor="edit-activity" className="text-sm font-semibold text-gray-700">
              Aktivitas <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-activity"
              type="text"
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              placeholder="Contoh: Rapat tim, Coding, Training"
              className="w-full"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-time" className="text-sm font-semibold text-gray-700">
                Jam Mulai <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-start-time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end-time" className="text-sm font-semibold text-gray-700">
                Jam Selesai <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-end-time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">
              Deskripsi (Opsional)
            </Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail aktivitas yang dikerjakan..."
              className="w-full min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-gray-300 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold"
            >
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
  )
}
