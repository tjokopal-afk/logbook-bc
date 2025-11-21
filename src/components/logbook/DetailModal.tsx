// =========================================
// DETAIL MODAL COMPONENT
// Optimized with better table and actions
// =========================================

import { Button } from '@/components/ui/button';
import { formatDate, calculateTotalDuration } from '@/lib/utils/dateUtils';
import { downloadTimesheetPDF, downloadTimesheetHTML } from '@/lib/utils/pdfGenerator';
import type { WeeklyLogbook } from '@/types/logbook.types';
import { X, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { useDeleteWeeklyLogbook } from '@/hooks/useLogbookEntries';
import { useState } from 'react';

interface DetailModalProps {
  logbook: WeeklyLogbook;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DetailModal({ logbook, open, onClose, onDeleted }: DetailModalProps) {
  const deleteWeekly = useDeleteWeeklyLogbook();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const totalDuration = calculateTotalDuration(
    logbook.entries.map((e) => String(e.duration))
  );

  // Mock user data - in production, get from auth context
  const userData = {
    name: 'Admin User',
    department: 'IT Department',
    university: 'Universitas Indonesia',
    nim: '123456789',
    mentorName: 'Mentor Name',
    mentorId: 'MNT001',
  };

  const handleDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${logbook.name}"?\n\nSemua ${logbook.entriesCount} aktivitas akan dihapus permanen.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteWeekly.mutateAsync(logbook.name);
      onDeleted();
    } catch (error) {
      console.error('Error deleting weekly logbook:', error);
      alert(error instanceof Error ? error.message : 'Gagal menghapus logbook');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await downloadTimesheetPDF(logbook, userData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error instanceof Error ? error.message : 'Gagal membuat PDF. Coba download HTML.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadHTML = () => {
    try {
      downloadTimesheetHTML(logbook, userData);
    } catch (error) {
      console.error('Error downloading HTML:', error);
      alert('Gagal download HTML');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{logbook.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(logbook.startDate)} - {formatDate(logbook.endDate)} • {logbook.entriesCount} aktivitas • Total: {totalDuration}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logbook.entries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-md">
                      <div className="line-clamp-2" title={entry.description || '-'}>
                        {entry.description || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 sticky bottom-0">
          <div className="text-sm text-gray-600">
            Total <strong>{logbook.entriesCount}</strong> aktivitas dengan durasi <strong>{totalDuration}</strong>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleDownloadPDF} 
              disabled={isDownloading}
              variant="default" 
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button 
              onClick={handleDownloadHTML} 
              variant="outline" 
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Download HTML
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus Logbook
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
