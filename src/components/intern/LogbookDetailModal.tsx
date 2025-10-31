// =========================================
// LOGBOOK DETAIL MODAL - View Weekly Logbook Details
// =========================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Calendar, Clock, Loader2 } from 'lucide-react';
import type { LogbookEntry } from '@/types/logbook.types';
import { exportWeeklyReportToPDF } from '@/utils/pdfExport';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface LogbookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyName: string;
  entries: LogbookEntry[];
}

export function LogbookDetailModal({
  isOpen,
  onClose,
  weeklyName,
  entries,
}: LogbookDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const totalDuration = entries.reduce((sum, entry) => {
    const minutes = entry.duration_minutes || 0;
    return sum + (minutes / 60);
  }, 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      toast({
        title: 'Generating PDF...',
        description: 'Please wait while we prepare your timesheet',
      });

      // Extract week number
      const weekMatch = weeklyName.match(/\d+/);
      const weekNumber = weekMatch ? parseInt(weekMatch[0]) : 1;

      // Get date range
      const dates = entries.map(e => new Date(e.entry_date));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      const formatDateShort = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      };

      const period = `${formatDateShort(minDate)} - ${formatDateShort(maxDate)}`;

      // Convert entries to PDF format with REAL data
      const pdfEntries = entries.map(entry => ({
        date: formatDate(entry.entry_date),
        startTime: formatTime(entry.start_time),
        endTime: formatTime(entry.end_time),
        duration: entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : '-',
        activity: entry.activity || 'Daily Task',
        description: entry.content || '-'
      }));

      // Create report with real user data
      const report = {
        weekNumber,
        period,
        entries: pdfEntries,
        internName: (user as any)?.name || 'Intern Name',
        internNIM: (user as any)?.nim || '-',
        university: (user as any)?.university || '-',
        department: (user as any)?.department || '-',
        mentorName: (user as any)?.mentor_name || 'Mentor Name',
        mentorNIP: (user as any)?.mentor_nip || '-',
        status: 'draft' as const
      };

      await exportWeeklyReportToPDF(report);

      toast({
        title: 'Success!',
        description: 'PDF has been downloaded successfully',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{weeklyName}</DialogTitle>
              <DialogDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  {entries.length} aktivitas
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Total durasi: {totalDuration.toFixed(1)} jam
                </div>
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Entries List */}
        <div className="mt-6 space-y-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(entry.entry_date)}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                    {entry.duration_minutes && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}m
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  #{index + 1}
                </span>
              </div>

              <div className="space-y-2">
                <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {entry.content}
                </div>
                {entry.category && entry.category !== 'daily task' && (
                  <p className="text-xs text-gray-500 italic">
                    Kategori: {entry.category}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
