import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, Briefcase, Eye, Target, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { calculateProjectProgress, getProjectProgressDetails } from '@/services/taskService';

interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface ProjectWithStats extends Project {
  myTaskCount: number;
  totalTaskCount: number;
  participantCount: number;
  document_count?: number;
  progress?: number;
  task_stats?: { total: number; completed: number; pending: number };
  completion_rate?: number;
}

export default function MyProjects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadProjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProjects = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: participantsData, error: participantsError } = await supabase
        .from('project_participants')
        .select('project_id, role_in_project')
        .eq('user_id', user.id);

      if (participantsError) throw participantsError;

      if (!participantsData || participantsData.length === 0) {
        setProjects([]);
        return;
      }

      const projectIds = participantsData.map((p: { project_id: string }) => p.project_id);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const projectsWithStats = await Promise.all(
        (projectsData || []).map(async (project: Project) => {
          const { count: myTaskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('assigned_to', user.id);

          const { count: totalTaskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          const { count: participantCount } = await supabase
            .from('project_participants')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          const { count: documentCount } = await supabase
            .from('project_documents')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          // Use shared service to calculate overall progress and task breakdown
          const progress = await calculateProjectProgress(project.id).catch(() => 0);
          const progressDetails = await getProjectProgressDetails(project.id).catch(() => ({ totalTasks: 0, completedTasks: 0, pendingTasks: 0 } as any));

          return {
            ...project,
            myTaskCount: myTaskCount || 0,
            totalTaskCount: totalTaskCount || 0,
            participantCount: participantCount || 0,
            document_count: documentCount || 0,
            progress: progress,
            task_stats: {
              total: (progressDetails as any).totalTasks ?? 0,
              completed: (progressDetails as any).completedTasks ?? 0,
              pending: (progressDetails as any).pendingTasks ?? 0,
            },
            completion_rate: progress,
          } as ProjectWithStats;
        })
      );

      setProjects(projectsWithStats);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-1">Projects you are participating in</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              You have not been assigned to any projects yet. Contact your admin to get added to projects.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const daysRemaining = getDaysRemaining(project.end_date);
            const progress = project.progress || 0;
            const taskStats = project.task_stats || { total: 0, completed: 0, pending: 0 };

            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        {getStatusBadge(project.status)}
                      </div>
                      <CardDescription>{project.description || 'No description'}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/intern/projects/${project.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Period</p>
                        <p className="text-sm font-medium">{format(new Date(project.start_date), 'dd MMM', { locale: idLocale })} - {format(new Date(project.end_date), 'dd MMM yyyy', { locale: idLocale })}</p>
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
                        <p className="text-sm font-medium">{project.participantCount || 0}</p>
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
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Overall Progress</span>
                      <span className="text-sm text-gray-600">{taskStats.completed}/{taskStats.total} tasks completed</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span>{progress}% Complete</span>
                      <span>{taskStats.pending} tasks pending</span>
                    </div>
                  </div>

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
