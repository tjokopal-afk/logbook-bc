// =========================================
// DRAFT ENTRIES TABLE - Preview Draft Aktivitas
// =========================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import type { LogbookEntry } from '@/types/logbook.types';
import { EditEntryDialog } from './EditEntryDialog';

interface DraftEntriesTableProps {
  entries: LogbookEntry[];
  isLoading: boolean;
  onEntryUpdated: () => void;
}

export function DraftEntriesTable({ entries, isLoading, onEntryUpdated }: DraftEntriesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEdit = (entry: LogbookEntry) => {
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onEntryUpdated();
  };

  const handleDelete = async (id: string, activity: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus aktivitas "${activity}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('logbook_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      onEntryUpdated();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Gagal menghapus aktivitas. Silakan coba lagi.');
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
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900">Belum ada draft aktivitas</h3>
        <p className="mt-1 text-sm text-gray-500">
          Mulai tambahkan aktivitas harian Anda menggunakan form di tab "Input Aktivitas"
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Aktivitas</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-40">Waktu</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">Durasi</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">Kategori</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(entry.entry_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="max-w-md whitespace-pre-wrap break-words">
                    {entry.content}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                  {entry.start_time ? new Date(entry.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} - {entry.end_time ? new Date(entry.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-600">
                  {entry.category || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id, entry.content)}
                      disabled={deletingId === entry.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      </div>

      {/* Edit Dialog */}
      {editingEntry && (
        <EditEntryDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          entry={editingEntry}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
