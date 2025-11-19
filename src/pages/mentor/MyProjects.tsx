// =========================================
// MENTOR - MY PROJECTS PAGE
// Shows only projects where mentor is a participant
// Can view and edit assigned projects
// =========================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PROJECT_ROLES } from '@/utils/roleConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  Search, 
  Eye,
  Users,
  Calendar,
  Loader2,
  Crown,
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
  FileText
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { calculateProjectProgress, getProjectProgressDetails } from '@/services/taskService';

interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  created_by?: string;
  created_by_name?: string;
  participant_count?: number;
  document_count?: number;
  task_count?: number;
  completion_rate?: number;
  role_in_project?: typeof PROJECT_ROLES.PIC | typeof PROJECT_ROLES.MEMBER;
  task_stats?: {
    total: number;
    completed: number;
    pending: number;
  };
  progress?: number;
}

export default function MyProjects() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadMyProjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, searchQuery, statusFilter]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadMyProjects = async () => {
    setLoading(true);
    try {
      // Get projects where user is a participant
      const { data: participantsData, error: participantsError } = await supabase
        .from('project_participants')
        .select('project_id, role_in_project')
        .eq('user_id', currentUserId);

      if (participantsError) throw participantsError;

      if (!participantsData || participantsData.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const projectIds = participantsData.map(p => p.project_id);
      const roleMap = new Map(participantsData.map(p => [p.project_id, p.role_in_project]));

      // Fetch project details
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch additional data for each project
      const projectsWithData = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get creator info
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', project.created_by || '')
            .single();

          // Get participant count
          const { count: participantCount } = await supabase
            .from('project_participants')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          // Get document count
          const { count: documentCount } = await supabase
            .from('project_documents')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          // Get detailed task statistics
          const progress = await calculateProjectProgress(project.id);
          const progressDetails = await getProjectProgressDetails(project.id);

          return {
            ...project,
            created_by_name: creatorData?.full_name || 'Unknown',
            participant_count: participantCount || 0,
            document_count: documentCount || 0,
            progress: progress,
            task_stats: {
              total: progressDetails.total,
              completed: progressDetails.completed,
              pending: progressDetails.pending,
            },
            completion_rate: progress,
            role_in_project: roleMap.get(project.id) || PROJECT_ROLES.MEMBER,
          };
        })
      );

      setProjects(projectsWithData);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600">Completed</Badge>;
      case 'upcoming':
        return <Badge className="bg-yellow-600">Upcoming</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/mentor/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-purple-600" />
            My Projects
          </h1>
          <p className="text-gray-600 mt-1">Projects you're assigned to</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {projects.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">As PIC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {projects.filter(p => p.role_in_project === PROJECT_ROLES.PIC).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {projects.filter(p => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'active', 'completed', 'upcoming'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters'
                : "You haven't been assigned to any projects yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredProjects.map((project) => {
            const daysRemaining = getDaysRemaining(project.end_date);
            const progress = project.progress || 0;
            const taskStats = project.task_stats || { total: 0, completed: 0, pending: 0 };

            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl flex items-center gap-2">
                          {project.name}
                          {project.role_in_project === PROJECT_ROLES.PIC && (
                            <Badge className="bg-yellow-500">
                              <Crown className="w-3 h-3 mr-1" />
                              PIC
                            </Badge>
                          )}
                        </CardTitle>
                        {getStatusBadge(project.status)}
                      </div>
                      <CardDescription>{project.description || 'No description'}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProject(project.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Period</p>
                        <p className="text-sm font-medium">
                          {format(new Date(project.start_date), 'dd MMM', { locale: idLocale })} - {format(new Date(project.end_date), 'dd MMM yyyy', { locale: idLocale })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Days Left</p>
                        <p className="text-sm font-medium text-blue-600">{daysRemaining} hari</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Team Members</p>
                        <p className="text-sm font-medium">{project.participant_count || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Documents</p>
                        <p className="text-sm font-medium">{project.document_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Overall Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Overall Progress</span>
                      <span className="text-sm text-gray-600">
                        {taskStats.completed}/{taskStats.total} tasks completed
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span>{progress}% Complete</span>
                      <span>{taskStats.pending} tasks pending</span>
                    </div>
                  </div>

                  {/* Task Statistics */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold">Task Overview</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700 font-medium">Total Tasks</p>
                        <p className="text-2xl font-bold text-blue-900">{taskStats.total}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-xs text-green-700 font-medium">Completed</p>
                        <p className="text-2xl font-bold text-green-900">{taskStats.completed}</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-700 font-medium">Pending</p>
                        <p className="text-2xl font-bold text-orange-900">{taskStats.pending}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
