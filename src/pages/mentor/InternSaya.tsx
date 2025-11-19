// =========================================
// INTERN SAYA PAGE - Mentor View
// List and manage interns under mentorship
// =========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Eye,
  Briefcase,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

interface Intern {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  affiliation: string;
  projectName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  lastActivity: string;
  totalReports: number;
  totalHours: number;
}

export default function InternSaya() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [filteredInterns, setFilteredInterns] = useState<Intern[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadInterns();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interns, searchQuery, statusFilter]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadInterns = async () => {
    setLoading(true);
    try {
      console.log('Loading interns for mentor:', currentUserId);
      
      // Step 1: Get all interns assigned to this mentor using profiles.mentor field
      const { data: internProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          affiliation,
          role,
          mentor,
          batch,
          start_date,
          end_date
        `)
        .eq('mentor', currentUserId);

      console.log('Interns from profiles.mentor:', { 
        mentorId: currentUserId, 
        count: internProfiles?.length, 
        error: profilesError
      });

      if (profilesError) throw profilesError;

      if (!internProfiles || internProfiles.length === 0) {
        console.warn('No interns found where profiles.mentor = mentor ID');
        setInterns([]);
        setLoading(false);
        return;
      }

      // Step 2: Get their project assignments
      const internIds = (internProfiles || []).map((p: { id: string }) => p.id);
      
      const { data: internParticipants, error: participantsError } = await supabase
        .from('project_participants')
        .select(`
          user_id,
          project_id,
          projects:project_id (
            id,
            name,
            start_date,
            end_date,
            status
          )
        `)
        .in('user_id', internIds);

      console.log('Intern project assignments:', { 
        count: internParticipants?.length, 
        error: participantsError
      });

      if (participantsError) throw participantsError;

      // Build a map of intern ID to their first project
      const internProjectMap = new Map<string, { id: string; name: string; start_date: string; end_date: string; status: string }>();
      internParticipants?.forEach((p: { user_id: string; projects: { id: string; name: string; start_date: string; end_date: string; status: string } }) => {
        if (!internProjectMap.has(p.user_id)) {
          internProjectMap.set(p.user_id, p.projects);
        }
      });

      // Step 3: Build intern data with statistics
      const internsData = await Promise.all(
        (internProfiles || []).map(async (profile: { id: string; full_name: string; email: string; avatar_url?: string; affiliation?: string; start_date?: string; end_date?: string }) => {
          // Get intern's project assignment
          const project = internProjectMap.get(profile.id);

          // Get logbook stats
          const { count: totalReports } = await supabase
            .from('logbook_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Get total hours from logbook using duration_minutes or derive from start/end
          const { data: logbookData } = await supabase
            .from('logbook_entries')
            .select('duration_minutes, start_time, end_time')
            .eq('user_id', profile.id);

          const totalMinutes = (logbookData || []).reduce((sum: number, entry: { duration_minutes?: number; start_time?: string; end_time?: string }) => {
            if (typeof entry.duration_minutes === 'number') return sum + entry.duration_minutes;
            if (entry.start_time && entry.end_time) {
              const start = new Date(entry.start_time);
              const end = new Date(entry.end_time);
              const diff = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
              return sum + diff;
            }
            return sum;
          }, 0);
          const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // 1 decimal

          // Get last activity
          const { data: lastActivityData } = await supabase
            .from('logbook_entries')
            .select('created_at')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Use intern's start/end date if no project assigned
          const startDate = project?.start_date || profile.start_date;
          const endDate = project?.end_date || profile.end_date;

          // Determine status based on end date
          const status = endDate && new Date(endDate) > new Date() ? 'active' : 'completed';

          return {
            id: profile.id,
            name: profile.full_name || profile.email,
            avatar: profile.avatar_url,
            email: profile.email,
            affiliation: profile.affiliation || 'No affiliation',
            projectName: project?.name || 'No project assigned',
            startDate: startDate || new Date().toISOString(),
            endDate: endDate || new Date().toISOString(),
            status: status as 'active' | 'completed',
            lastActivity: lastActivityData?.created_at || new Date().toISOString(),
            totalReports: totalReports || 0,
            totalHours: totalHours,
          };
        })
      );

      console.log('Final interns list:', internsData.length);
      setInterns(internsData);
    } catch (error) {
      console.error('Error loading interns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interns',
        variant: 'destructive',
      });
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = interns;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(query) ||
        i.affiliation.toLowerCase().includes(query) ||
        i.projectName.toLowerCase().includes(query)
      );
    }

    setFilteredInterns(filtered);
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const activeCount = interns.filter(i => i.status === 'active').length;
  const completedCount = interns.filter(i => i.status === 'completed').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Intern Saya</h1>
        <p className="text-muted-foreground mt-2">
          Daftar intern dalam bimbingan
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari nama, affiliation, atau project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({interns.length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active ({activeCount})
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completed ({completedCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intern Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterns.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-0 shadow-none bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-6 p-4 rounded-full bg-white shadow-sm">
                    <Building2 className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak ada intern</h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    {searchQuery ? 'Coba kata kunci lain atau sesuaikan filter Anda' : 'Belum ada intern yang ditugaskan untuk bimbingan Anda'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredInterns.map((intern) => {
            const daysRemaining = getDaysRemaining(intern.endDate);
            const daysSinceLastActivity = differenceInDays(new Date(), new Date(intern.lastActivity));
            const progressPercent = Math.min(
              (differenceInDays(new Date(), new Date(intern.startDate)) / 
              Math.max(1, differenceInDays(new Date(intern.endDate), new Date(intern.startDate)))) * 100,
              100
            );

            return (
              <Card 
                key={intern.id} 
                className="hover:shadow-xl transition-all duration-300 flex flex-col border-0 bg-white overflow-hidden group"
              >
                {/* Status Bar at Top */}
                <div className={`h-1 ${intern.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} />
                
                <CardContent className="pt-5 flex flex-col flex-1 pb-4">
                  {/* Header with Avatar - Improved Layout */}
                  <div className="flex gap-4 mb-5">
                    <Avatar className="w-16 h-16 ring-2 ring-offset-2 ring-blue-100 flex-shrink-0">
                      <AvatarImage src={intern.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-lg font-bold">
                        {intern.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">{intern.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{intern.email}</p>
                      <Badge className={`mt-2 text-xs font-medium ${
                        intern.status === 'active' 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200' 
                          : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200'
                      }`}>
                        {intern.status === 'active' ? '✓ Active' : 'Completed'}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-medium text-gray-600">Progress</p>
                      <p className="text-xs font-semibold text-gray-700">{Math.round(progressPercent)}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Info Section - Grid Layout */}
                  <div className="space-y-2.5 mb-4 flex-1">
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-transparent">
                      <Building2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">University</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{intern.affiliation}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-transparent">
                      <Briefcase className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Project</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{intern.projectName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-transparent">
                      <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Duration</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(intern.startDate), 'MMM dd', { locale: idLocale })}
                          <span className="text-gray-400 mx-1">→</span>
                          {format(new Date(intern.endDate), 'MMM dd', { locale: idLocale })} 
                          <span> </span>
                          ({daysRemaining > 0 ? `${daysRemaining}d left` : 'Done'})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid - Enhanced */}
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">Reports</p>
                      <p className="text-2xl font-bold text-blue-600">{intern.totalReports}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">Hours</p>
                      <p className="text-2xl font-bold text-emerald-600">{intern.totalHours}h</p>
                    </div>
                  </div>

                  {/* Last Activity - Improved */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 mb-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs text-blue-700 font-medium">
                      Last activity <span className="font-bold">{daysSinceLastActivity}d</span> ago
                    </p>
                  </div>

                  {/* Action Buttons - Improved */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        setSelectedIntern(intern);
                        setShowDetailDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
                      variant="outline"
                      onClick={() => navigate(`/mentor/review-logbook?intern=${intern.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-1.5" />
                      Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      {showDetailDialog && selectedIntern && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
            {/* Header Bar */}
            <div className={`h-2 ${selectedIntern.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} />
            
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                  <Avatar className="w-28 h-28 ring-4 ring-offset-2 ring-blue-100 flex-shrink-0">
                    <AvatarImage src={selectedIntern.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-4xl font-bold">
                      {selectedIntern.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900">{selectedIntern.name}</h2>
                    <p className="text-gray-500 mt-1">{selectedIntern.email}</p>
                    <div className="flex gap-2 mt-4">
                      <Badge className={`text-sm font-semibold ${
                        selectedIntern.status === 'active' 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200' 
                          : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200'
                      }`}>
                        {selectedIntern.status === 'active' ? '✓ Active' : 'Completed'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-gray-100"
                    onClick={() => setShowDetailDialog(false)}
                  >
                    ✕
                  </Button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-transparent border border-blue-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">University</p>
                    <p className="text-lg font-bold text-gray-900">{selectedIntern.affiliation}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-transparent border border-amber-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Project</p>
                    <p className="text-lg font-bold text-gray-900">{selectedIntern.projectName}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-transparent border border-purple-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Start Date</p>
                    <p className="text-lg font-bold text-gray-900">{format(new Date(selectedIntern.startDate), 'PPP', { locale: idLocale })}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-pink-50 to-transparent border border-pink-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">End Date</p>
                    <p className="text-lg font-bold text-gray-900">{format(new Date(selectedIntern.endDate), 'PPP', { locale: idLocale })}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-transparent border border-indigo-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Reports</p>
                    <p className="text-lg font-bold text-indigo-600">{selectedIntern.totalReports}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-transparent border border-emerald-100">
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Hours</p>
                    <p className="text-lg font-bold text-emerald-600">{selectedIntern.totalHours} hours</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-11"
                    onClick={() => navigate(`/mentor/review-logbook?intern=${selectedIntern.id}`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Logbooks
                  </Button>
                
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
