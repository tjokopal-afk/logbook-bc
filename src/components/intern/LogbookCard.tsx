// =========================================
// LOGBOOK CARD - Display Weekly Logbook
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Calendar, Clock, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { exportWeeklyReportToPDF } from '@/utils/pdfExport';
import type { LogbookEntry } from '@/types/logbook.types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface LogbookCardProps {
  weeklyName: string;
  entriesCount: number;
  totalDuration: number;
  startDate: string;
  endDate: string;
  entries: LogbookEntry[];
  onViewDetail: () => void;
  isSubmitted?: boolean;
  submittedAt?: string;
}

interface KeyActivity {
  id: string;
  name: string;
  isCompleted: boolean;
}

export function LogbookCard({
  weeklyName,
  entriesCount,
  totalDuration,
  startDate,
  endDate,
  entries,
  onViewDetail,
  isSubmitted = false,
  submittedAt,
}: LogbookCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [keyActivities, setKeyActivities] = useState<KeyActivity[]>([
    { id: '1', name: 'Memahami Struktur Project', isCompleted: false },
    { id: '2', name: 'Setup Development Environment', isCompleted: false },
    { id: '3', name: 'Implementasi Fitur Login', isCompleted: false },
    { id: '4', name: 'Integrasi API Backend', isCompleted: false },
    { id: '5', name: 'Testing & Bug Fixing', isCompleted: false },
    { id: '6', name: 'Code Review dengan Mentor', isCompleted: false },
    { id: '7', name: 'Dokumentasi Project', isCompleted: false },
    { id: '8', name: 'Deployment ke Production', isCompleted: false },
  ]);

  const toggleActivity = (id: string) => {
    setKeyActivities(prev =>
      prev.map(activity =>
        activity.id === id
          ? { ...activity, isCompleted: !activity.isCompleted }
          : activity
      )
    );
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      toast({
        title: 'Generating PDF...',
        description: 'Please wait while we prepare your timesheet',
      });

      // Extract week number from weeklyName (e.g., "Week 12" -> 12)
      const weekMatch = weeklyName.match(/\d+/);
      const weekNumber = weekMatch ? parseInt(weekMatch[0]) : 1;

      // Format period
      const period = `${formatDate(startDate)} - ${formatDate(endDate)}`;

      // Convert entries to PDF format with REAL data
      const pdfEntries = entries.map(entry => ({
        date: formatDate(entry.entry_date),
        startTime: entry.start_time || '-',
        endTime: entry.end_time || '-',
        duration: entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : '-',
        activity: entry.activity || 'Daily Task',
        description: entry.content || '-'
      }));

      // Create report object with real user data
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
        status: (isSubmitted ? 'submitted' : 'draft') as 'draft' | 'submitted' | 'approved'
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

  const handleSubmit = () => {
    const completedActivities = keyActivities.filter(a => a.isCompleted);
    console.log('Submitting weekly report with completed activities:', completedActivities);
    // TODO: Send to Supabase
    alert(`Laporan mingguan "${weeklyName}" berhasil dikirim ke mentor!\n\nKey Activities Selesai: ${completedActivities.length}/${keyActivities.length}`);
    setShowSubmitDialog(false);
  };
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{weeklyName}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-sm mt-1">
              <Calendar className="h-3 w-3" />
              {formatDate(startDate)} - {formatDate(endDate)}
            </CardDescription>
          </div>
          {isSubmitted && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Terkirim
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Aktivitas</p>
            <p className="text-lg font-semibold text-gray-900">{entriesCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Durasi
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {totalDuration.toFixed(1)}h
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetail}
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              Detail
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
          {!isSubmitted && (
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowSubmitDialog(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit ke Mentor
            </Button>
          )}
          {isSubmitted && submittedAt && (
            <p className="text-xs text-gray-500 text-center">
              Dikirim: {formatDate(submittedAt)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Submit Dialog with Key Activities */}
    <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Laporan Mingguan ke Mentor</DialogTitle>
          <DialogDescription>
            Pilih key activities yang sudah diselesaikan minggu ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Logbook Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">{weeklyName}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>📅 {formatDate(startDate)} - {formatDate(endDate)}</div>
              <div>📝 {entriesCount} aktivitas</div>
              <div>⏱️ {totalDuration.toFixed(1)} jam</div>
            </div>
          </div>

          {/* Key Activities Checklist */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Key Activities yang Diselesaikan:</h4>
            <div className="space-y-2">
              {keyActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    activity.isCompleted
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleActivity(activity.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {activity.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <span
                      className={`flex-1 ${
                        activity.isCompleted
                          ? 'text-green-900 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {activity.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">
                {keyActivities.filter(a => a.isCompleted).length} dari {keyActivities.length}
              </span>{' '}
              key activities selesai
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Send className="mr-2 h-4 w-4" />
            Submit Laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
