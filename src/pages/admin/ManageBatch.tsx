// =========================================
// ADMIN - MANAGE BATCH PAGE
// Page to list, create and delete batches
// =========================================

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Trash, Loader2 } from 'lucide-react'
import AddBatchDialog from '@/components/admin/AddBatchDialog'
import { supabase } from '@/supabase'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface Batch {
  id: string
  batch_name: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  created_at?: string | null
}

export default function ManageBatch() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [openAdd, setOpenAdd] = useState(false)

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('batches').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setBatches((data as Batch[]) || [])
    } catch (err: any) {
      console.error('Load batches error', err)
      toast({ title: 'Error', description: 'Gagal memuat daftar batch', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus batch ini? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      const { error } = await supabase.from('batches').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Berhasil', description: 'Batch dihapus' })
      loadBatches()
    } catch (err: any) {
      console.error('Delete batch error', err)
      toast({ title: 'Error', description: 'Gagal menghapus batch', variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">Manajemen Batch</h1>
          <p className="text-muted-foreground mt-2">Kelola batch atau kelompok peserta</p>
        </div>
        <div>
          <Button onClick={() => setOpenAdd(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Batch
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Batch</CardTitle>
          <CardDescription>List of created batches</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12">Belum ada batch. Tambahkan batch baru.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Nama</th>
                    <th className="px-4 py-2 text-left">Deskripsi</th>
                    <th className="px-4 py-2 text-left">Periode</th>
                    <th className="px-4 py-2 text-left">Dibuat</th>
                    <th className="px-4 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{b.batch_name}</td>
                      <td className="px-4 py-3">{b.description || '-'}</td>
                      <td className="px-4 py-3">
                        {b.start_date ? format(new Date(b.start_date), 'dd MMM yyyy') : '-'}
                        {' - '}
                        {b.end_date ? format(new Date(b.end_date), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3">{b.created_at ? format(new Date(b.created_at), 'dd MMM yyyy') : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(b.id)}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddBatchDialog
        isOpen={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => {
          loadBatches()
        }}
      />
    </div>
  )
}
