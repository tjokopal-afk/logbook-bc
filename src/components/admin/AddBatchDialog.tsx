// =========================================
// ADD BATCH DIALOG
// Dialog for creating a new batch (manajemen batch)
// =========================================

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createBatch } from '@/services/batchService'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'

interface AddBatchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddBatchDialog({ isOpen, onClose, onSuccess }: AddBatchDialogProps) {
  const { toast } = useToast()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    batch_name: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        batch_name: form.batch_name.trim(),
        description: form.description.trim() || undefined,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }

      // Pass user role to use admin client if admin/superuser
      const { error } = await createBatch(payload, profile?.role)

      if (error) {
        // Re-throw so the catch block below handles toast + logging
        throw error
      }

      toast({ title: 'Berhasil', description: 'Batch berhasil ditambahkan' })
      onSuccess?.()
      onClose()
    } catch (unknownErr) {
      // Safer handling for unknown error shapes
      const errMsg =
        unknownErr && typeof unknownErr === 'object' && 'message' in unknownErr
          ? String((unknownErr as { message?: unknown }).message)
          : String(unknownErr)
  // Log full object for debugging
  console.error('Add batch error', unknownErr)
      toast({ title: 'Error', description: errMsg || 'Gagal menambahkan batch', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Batch</DialogTitle>
          <DialogDescription>Buat kelompok batch baru untuk pengelompokan peserta</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Batch *</Label>
            <Input
              id="name"
              required
              value={form.batch_name}
              onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
              placeholder="Contoh: Batch 2025"
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi singkat"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start_date">Mulai</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Selesai</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Tambah Batch'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
