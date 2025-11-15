// =========================================
// ADMIN - MONITORING PAGE
// View all logbooks and attendance
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Search, 
  BookOpen,
  Calendar,
  User,
  Loader2,
  Download
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LogbookEntry {
  id: string;
  user_id: string;
  user_name: string;
  project_id: string;
  project_name: string;
  entry_date: string;
  content: string;
  duration_minutes: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
}

// Reviews removed

interface InternAttendance {
  intern_id: string;
  intern_name: string;
  total_days: number;
  dates: string[];
}

export default function Monitoring() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('logbooks');
  
  // Logbook state
  const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
  const [filteredLogbooks, setFilteredLogbooks] = useState<LogbookEntry[]>([]);
  const [logbookSearch, setLogbookSearch] = useState('');
  const [logbookStatusFilter, setLogbookStatusFilter] = useState('all');
  const [loadingLogbooks, setLoadingLogbooks] = useState(true);
  
  // Review tab removed

  // Attendance state
  const [attendance, setAttendance] = useState<InternAttendance[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<InternAttendance[]>([]);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [expandedIntern, setExpandedIntern] = useState<string | null>(null);

  useEffect(() => {
    loadLogbooks();
    loadAttendance();
  }, []);

  useEffect(() => {
    applyLogbookFilters();
  }, [logbooks, logbookSearch, logbookStatusFilter]);

  // Review tab removed

  useEffect(() => {
    applyAttendanceFilters();
  }, [attendance, attendanceSearch]);

  const loadLogbooks = async () => {
    setLoadingLogbooks(true);
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Load maps for profiles and projects to avoid relational joins
      const [{ data: profileRows }, { data: projectRows }] = await Promise.all([
        supabase.from('profiles').select('id, full_name'),
        supabase.from('projects').select('id, name'),
      ]);

      const profileMap = new Map<string, string>();
      (profileRows || []).forEach((p: any) => profileMap.set(p.id, p.full_name || 'Unknown'));
      const projectMap = new Map<string, string>();
      (projectRows || []).forEach((p: any) => projectMap.set(p.id, p.name || 'No Project'));

      const formatted = (data || []).map((entry: any) => {
        const status: LogbookEntry['status'] = entry.is_rejected
          ? 'rejected'
          : entry.is_approved
          ? 'approved'
          : entry.is_submitted
          ? 'submitted'
          : 'draft';
        return {
          id: entry.id,
          user_id: entry.user_id,
          user_name: profileMap.get(entry.user_id) || 'Unknown',
          project_id: entry.project_id,
          project_name: projectMap.get(entry.project_id) || 'No Project',
          entry_date: entry.entry_date,
          content: entry.content || '',
          duration_minutes: entry.duration_minutes || 0,
          status,
          created_at: entry.created_at,
        } as LogbookEntry;
      });

      setLogbooks(formatted);
    } catch (error) {
      console.error('Error loading logbooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load logbooks',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogbooks(false);
    }
  };

  const loadAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const { data: internProfiles, error: internError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'intern');
      if (internError) throw internError;

      const { data: entries, error: entriesError } = await supabase
        .from('logbook_entries')
        .select('user_id, entry_date');
      if (entriesError) throw entriesError;

      const map = new Map<string, Set<string>>();
      (entries || []).forEach((e: { user_id: string; entry_date: string }) => {
        if (!e.entry_date || !e.user_id) return;
        const d = e.entry_date.slice(0, 10);
        if (!map.has(e.user_id)) map.set(e.user_id, new Set<string>());
        map.get(e.user_id)!.add(d);
      });

      const list: InternAttendance[] = (internProfiles || []).map((p: { id: string; full_name?: string | null }) => {
        const dates = Array.from(map.get(p.id) || new Set<string>()).sort();
        return {
          intern_id: p.id,
          intern_name: p.full_name || 'Unknown',
          total_days: dates.length,
          dates,
        };
      });

      // Sort by name asc
      list.sort((a, b) => a.intern_name.localeCompare(b.intern_name));
      setAttendance(list);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({ title: 'Error', description: 'Failed to load attendance', variant: 'destructive' });
    } finally {
      setLoadingAttendance(false);
    }
  };


  const applyLogbookFilters = () => {
    let filtered = [...logbooks];

    if (logbookSearch.trim()) {
      const query = logbookSearch.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.user_name.toLowerCase().includes(query) ||
          entry.project_name.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query)
      );
    }

    if (logbookStatusFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.status === logbookStatusFilter);
    }

    setFilteredLogbooks(filtered);
  };


  const applyAttendanceFilters = () => {
    let filtered = [...attendance];
    if (attendanceSearch.trim()) {
      const q = attendanceSearch.toLowerCase();
      filtered = filtered.filter((a) => a.intern_name.toLowerCase().includes(q));
    }
    setFilteredAttendance(filtered);
  };

  const exportLogbooksCSV = () => {
    const csv = [
      ['Date', 'Intern', 'Project', 'Content', 'Duration (min)', 'Status'].join(','),
      ...filteredLogbooks.map((entry) =>
        [
          entry.entry_date,
          entry.user_name,
          entry.project_name,
          `"${entry.content.replace(/"/g, '""')}"`,
          entry.duration_minutes,
          entry.status,
        ].join(',')
      ),
    ].join('\n');

    downloadCSV(csv, 'logbooks');
  };

  // reviews export removed

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: `${filename} exported to CSV`,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  // rating stars removed

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Eye className="w-8 h-8 text-purple-600" />
          Monitoring
        </h1>
        <p className="text-muted-foreground mt-2">
          View all logbooks and attendance across the system
        </p>
      </div>

      {/* Stats removed as requested */}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logbooks" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Logbooks ({logbooks.length})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Daftar Hadir
          </TabsTrigger>
        </TabsList>

        {/* LOGBOOKS TAB */}
        <TabsContent value="logbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Logbooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by intern, project, or activity..."
                      value={logbookSearch}
                      onChange={(e) => setLogbookSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={logbookStatusFilter}
                    onChange={(e) => setLogbookStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <Button variant="outline" onClick={exportLogbooksCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredLogbooks.length} of {logbooks.length} entries
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logbook Entries</CardTitle>
              <CardDescription>All logbook entries from interns</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogbooks ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading logbooks...</span>
                </div>
              ) : filteredLogbooks.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No logbooks found</h3>
                  <p className="text-sm text-gray-600">
                    {logbookSearch || logbookStatusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No logbook entries yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogbooks.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{entry.user_name}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{entry.project_name}</span>
                            <Badge className={getStatusBadge(entry.status).className}>
                              {getStatusBadge(entry.status).label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{entry.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(entry.entry_date), 'dd MMM yyyy')}
                            </span>
                            <span>Duration: {entry.duration_minutes} min</span>
                            <span>
                              Submitted: {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ATTENDANCE TAB */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Daftar Hadir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Cari nama intern..."
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={() => {
                  const rows: string[] = [
                    ['Intern', 'Date'].join(','),
                    ...filteredAttendance.flatMap((i) => i.dates.map((d) => [
                      i.intern_name,
                      d,
                    ].join(',')))
                  ];
                  downloadCSV(rows.join('\n'), 'attendance');
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredAttendance.length} of {attendance.length} interns
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Hadir Intern</CardTitle>
              <CardDescription>List intern dan ringkasan kehadiran</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading attendance...</span>
                </div>
              ) : filteredAttendance.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No interns found</h3>
                  <p className="text-sm text-gray-600">{attendanceSearch ? 'Try a different keyword' : 'No attendance yet'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAttendance.map((i: InternAttendance) => (
                    <div key={i.intern_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{i.intern_name}</div>
                          <div className="text-xs text-gray-600">Hadir: {i.total_days} hari</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setExpandedIntern(expandedIntern === i.intern_id ? null : i.intern_id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {expandedIntern === i.intern_id ? 'Hide Detail' : 'Show Detail'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            const csv = [
                              ['Intern', 'Date'].join(','),
                              ...i.dates.map((d) => [i.intern_name, d].join(','))
                            ].join('\n');
                            downloadCSV(csv, `attendance_${i.intern_name.replace(/[^a-zA-Z0-9_-]/g, '')}`);
                          }}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                      {expandedIntern === i.intern_id && (
                        <div className="mt-4 overflow-x-auto">
                          {i.dates.length === 0 ? (
                            <div className="text-sm text-gray-600 italic">Belum ada kehadiran.</div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-gray-600">
                                  <th className="py-2 pr-4">Tanggal</th>
                                  <th className="py-2">Kehadiran</th>
                                </tr>
                              </thead>
                              <tbody>
                                {i.dates.map((d: string) => (
                                  <tr key={d} className="border-t">
                                    <td className="py-2 pr-4">{format(new Date(d), 'dd MMM yyyy')}</td>
                                    <td className="py-2"><Badge className="bg-green-100 text-green-700">Hadir</Badge></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
