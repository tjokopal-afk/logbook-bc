// =========================================
// DRAFT ENTRIES TABLE COMPONENT
// Professional Material UI Style with Edit Support
// =========================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDeleteEntry } from '@/hooks/useLogbookEntries';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/dateUtils';
import type { LogbookEntry } from '@/types/logbook.types';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { EditEntryDialog } from './EditEntryDialog';

interface DraftEntriesTableProps {
  entries: LogbookEntry[];
  isLoading: boolean;
  onEntryUpdated: () => void;
}

export function DraftEntriesTable({ entries, isLoading, onEntryUpdated }: DraftEntriesTableProps) {
  const deleteEntry = useDeleteEntry();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (entry: LogbookEntry) => {
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    onEntryUpdated();
  };

  const handleDelete = async (id: string, activity: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus aktivitas "${activity}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteEntry.mutateAsync(id);
      
      showToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Aktivitas berhasil dihapus',
      });
      
      onEntryUpdated();
    } catch (error) {
      console.error('Error deleting entry:', error);
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus aktivitas',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Memuat data...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900">Belum ada draft entries</h3>
        <p className="mt-1 text-sm text-gray-500">
          Mulai tambahkan aktivitas harian Anda menggunakan form di atas
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktivitas
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jam Mulai
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jam Selesai
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durasi
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deskripsi
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry, index) => (
            <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {index + 1}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {formatDate(entry.date)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {entry.activity}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {entry.start_time}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {entry.end_time}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {entry.duration}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={entry.description || '-'}>
                {entry.description || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                    className="text-brand-green hover:text-brand-green-dark hover:bg-green-50"
                    title="Edit aktivitas"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(entry.id, entry.activity)}
                    disabled={deletingId === entry.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Hapus"
                  >
                    {deletingId === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">
            Total: <span className="font-medium">{entries.length}</span> aktivitas
          </span>
          <span className="text-sm text-gray-500">
            Siap untuk disimpan sebagai logbook mingguan
          </span>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <EditEntryDialog
        entry={editingEntry}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingEntry(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
