// =========================================
// LOGBOOK CARD COMPONENT
// Optimized with better UX and animations
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, calculateTotalDuration } from '@/lib/utils/dateUtils';
import { downloadTimesheetPDF } from '@/lib/utils/pdfGenerator';
import type { WeeklyLogbook } from '@/types/logbook.types';
import { Calendar, Clock, Eye, Download, Trash2, Loader2 } from 'lucide-react';
import { useDeleteWeeklyLogbook } from '@/hooks/useLogbookEntries';

interface LogbookCardProps {
  logbook: WeeklyLogbook;
  onViewDetail: (logbook: WeeklyLogbook) => void;
  onDeleted: () => void;
}

export function LogbookCard({ logbook, onViewDetail, onDeleted }: LogbookCardProps) {
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
    const confirmMessage = `Apakah Anda yakin ingin menghapus "${logbook.name}"?\n\nSemua ${logbook.entriesCount} aktivitas akan dihapus permanen.`;
    
    if (!confirm(confirmMessage)) {
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
      alert(error instanceof Error ? error.message : 'Gagal membuat PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader>
        <CardTitle className="text-lg flex items-start justify-between">
          <span className="line-clamp-2 pr-2">{logbook.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {formatDate(logbook.startDate)} - {formatDate(logbook.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Total Durasi: {totalDuration}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-primary/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">
            {logbook.entriesCount}
          </div>
          <div className="text-xs text-gray-600">Aktivitas</div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onViewDetail(logbook)}
            className="w-full gap-2"
            variant="default"
          >
            <Eye className="h-4 w-4" />
            Lihat Detail
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex-1 gap-2"
              variant="outline"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              variant="outline"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
