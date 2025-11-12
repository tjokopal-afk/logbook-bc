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
  Download,
  Calendar,
  Building2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

// Mock data - replace with real Supabase data
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
  progress: number;
  lastActivity: string;
  totalReports: number;
  totalHours: number;
  avgRating: number;
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
      // Get projects where current mentor is a participant
      const { data: mentorProjects, error: projectsError } = await supabase
        .from('project_participants')
        .select('project_id')
        .eq('user_id', currentUserId);

      if (projectsError) throw projectsError;

      if (!mentorProjects || mentorProjects.length === 0) {
        setInterns([]);
        setLoading(false);
        return;
      }

      const projectIds = mentorProjects.map(p => p.project_id);

      // Get all interns who are participants in these projects
      const { data: internParticipants, error: participantsError } = await supabase
        .from('project_participants')
        .select(`
          user_id,
          project_id,
          projects (
            id,
            name,
            start_date,
            end_date,
            status
          )
        `)
        .in('project_id', projectIds)
        .neq('user_id', currentUserId);  // Exclude current mentor

      if (participantsError) throw participantsError;

      // Get unique intern IDs
      const internIds = [...new Set(internParticipants?.map(p => p.user_id) || [])];

      // Fetch intern profiles
      const { data: internProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', internIds)
        .eq('role', 'intern');

      if (profilesError) throw profilesError;

      // Build intern data with stats
      const internsData = await Promise.all(
        (internProfiles || []).map(async (profile) => {
          // Find intern's primary project (or first project)
          const internProject = internParticipants?.find(p => p.user_id === profile.id);
          const project = internProject?.projects as { id: string; name: string; start_date: string; end_date: string; status: string } | undefined;

          // Get logbook stats
          const { count: totalReports } = await supabase
            .from('logbook_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Get total hours from logbook
          const { data: logbookData } = await supabase
            .from('logbook_entries')
            .select('hours')
            .eq('user_id', profile.id);

          const totalHours = logbookData?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0;

          // Get task stats for progress calculation
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('is_reviewed, is_rejected')
            .eq('assigned_to', profile.id);

          const totalTasks = tasksData?.length || 0;
          const completedTasks = tasksData?.filter(t => t.is_reviewed && !t.is_rejected).length || 0;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // Get average rating from reviews
          const { data: reviewsData } = await supabase
            .from('logbook_reviews')
            .select('rating')
            .eq('intern_id', profile.id)
            .not('rating', 'is', null);

          const avgRating = reviewsData && reviewsData.length > 0
            ? reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length
            : 0;

          // Get last activity
          const { data: lastActivityData } = await supabase
            .from('logbook_entries')
            .select('created_at')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Determine status based on project end date
          const status = project && new Date(project.end_date) > new Date() ? 'active' : 'completed';

          return {
            id: profile.id,
            name: profile.full_name || profile.email,
            avatar: profile.avatar_url,
            email: profile.email,
            affiliation: profile.affiliation || 'No affiliation',
            projectName: project?.name || 'No project assigned',
            startDate: project?.start_date || new Date().toISOString(),
            endDate: project?.end_date || new Date().toISOString(),
            status: status as 'active' | 'completed',
            progress: progress,
            lastActivity: lastActivityData?.created_at || new Date().toISOString(),
            totalReports: totalReports || 0,
            totalHours: totalHours,
            avgRating: avgRating
          };
        })
      );

      setInterns(internsData);
    } catch (error) {
      console.error('Error loading interns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interns',
        variant: 'destructive',
      });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInterns.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tidak ada intern</h3>
                  <p className="text-sm text-gray-600">
                    {searchQuery ? 'Coba kata kunci lain' : 'Belum ada intern dalam bimbingan'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredInterns.map((intern) => {
            const daysRemaining = getDaysRemaining(intern.endDate);
            const daysSinceLastActivity = differenceInDays(new Date(), new Date(intern.lastActivity));

            return (
              <Card key={intern.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardContent className="pt-6 flex flex-col flex-1">
                  {/* Header with Avatar */}
                  <div className="flex flex-col items-center text-center mb-4">
                    <Avatar className="w-20 h-20 mb-3">
                      <AvatarImage src={intern.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                        {intern.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold">{intern.name}</h3>
                    <p className="text-sm text-gray-600">{intern.email}</p>
                    <Badge className={`mt-2 ${intern.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {intern.status === 'active' ? 'Active' : 'Completed'}
                    </Badge>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Affiliation</p>
                        <p className="text-sm font-medium">{intern.affiliation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Project</p>
                        <p className="text-sm font-medium">{intern.projectName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Period</p>
                        <p className="text-sm font-medium">
                          {format(new Date(intern.startDate), 'dd MMM', { locale: idLocale })} - 
                          {format(new Date(intern.endDate), 'dd MMM yyyy', { locale: idLocale })}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs font-semibold">{intern.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${intern.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Reports</p>
                        <p className="text-lg font-bold text-gray-900">{intern.totalReports}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Hours</p>
                        <p className="text-lg font-bold text-gray-900">{intern.totalHours}h</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Rating</p>
                        <p className="text-lg font-bold text-gray-900">⭐ {intern.avgRating.toFixed(1)}</p>
                      </div>
                      {intern.status === 'active' && (
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-gray-500">Days Left</p>
                          <p className="text-lg font-bold text-blue-600">{daysRemaining}</p>
                        </div>
                      )}
                    </div>

                    {/* Last Activity Warning */}
                    {intern.status === 'active' && daysSinceLastActivity > 7 && (
                      <div className="bg-orange-50 border border-orange-200 p-2 rounded text-xs text-orange-700">
                        ⚠️ Last activity: {daysSinceLastActivity} days ago
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-4">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setSelectedIntern(intern);
                        setShowDetailDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Detail Profile
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/mentor/review-logbook')}
                      >
                        <Briefcase className="w-4 h-4 mr-1" />
                        Project
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert('Export feature coming soon!')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      {showDetailDialog && selectedIntern && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Detail Profil Intern</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowDetailDialog(false);
                    setSelectedIntern(null);
                  }}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={selectedIntern.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-3xl">
                      {selectedIntern.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedIntern.name}</h3>
                    <p className="text-gray-600">{selectedIntern.email}</p>
                    <Badge className={`mt-2 ${selectedIntern.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {selectedIntern.status === 'active' ? 'Active' : 'Completed'}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Affiliation</p>
                    <p className="font-medium">{selectedIntern.affiliation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Project</p>
                    <p className="font-medium">{selectedIntern.projectName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">{format(new Date(selectedIntern.startDate), 'dd MMMM yyyy', { locale: idLocale })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium">{format(new Date(selectedIntern.endDate), 'dd MMMM yyyy', { locale: idLocale })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Activity</p>
                    <p className="font-medium">{format(new Date(selectedIntern.lastActivity), 'dd MMMM yyyy', { locale: idLocale })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="font-medium">{selectedIntern.progress}%</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedIntern.totalReports}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-green-600">{selectedIntern.totalHours}h</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">⭐ {selectedIntern.avgRating.toFixed(1)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      if (selectedIntern.totalReports > 0) {
                        // Navigate to review logbook with intern name as filter
                        navigate(`/mentor/review-logbook?intern=${encodeURIComponent(selectedIntern.name)}`);
                        setShowDetailDialog(false);
                      } else {
                        alert('Belum ada laporan tersubmit dari intern ini.');
                      }
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Lihat Laporan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      // Navigate to progress intern with intern name as filter
                      navigate(`/mentor/progress-intern?intern=${encodeURIComponent(selectedIntern.name)}`);
                      setShowDetailDialog(false);
                    }}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Lihat Progress
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
