// =========================================
// KELOLA PROYEK PAGE - Mentor View
// Manage project timeline, monthly targets, and key activity progress
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Edit,
  Target,
  TrendingUp
} from 'lucide-react';
import { EditProjectTimelineDialog } from '@/components/mentor/EditProjectTimelineDialog';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Mock data - replace with real Supabase data
interface KeyActivity {
  name: string;
  targetDays: number;
  completedBy: number; // Number of interns who completed
  avgDaysToComplete: number; // Average days taken
}

interface MonthlyTarget {
  month: string;
  targetActivities: string[]; // Which activities should be done this month
  completedCount: number;
  totalCount: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'planning';
  internCount: number;
  targetInterns: number;
  keyActivities: KeyActivity[];
  monthlyTargets: MonthlyTarget[];
  overallProgress: number;
}

export default function KelolaProyek() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'planning'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchQuery, statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    // TODO: Replace with real Supabase query
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Project Alpha',
        description: 'Development of internal management system',
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        status: 'active',
        internCount: 2,
        targetInterns: 3,
        keyActivities: [
          { name: 'Memahami Struktur Project', targetDays: 7, completedBy: 2, avgDaysToComplete: 5 },
          { name: 'Setup Development Environment', targetDays: 3, completedBy: 2, avgDaysToComplete: 2 },
          { name: 'Implementasi Fitur Login', targetDays: 14, completedBy: 1, avgDaysToComplete: 12 },
          { name: 'Integrasi API Backend', targetDays: 14, completedBy: 0, avgDaysToComplete: 0 },
          { name: 'Testing & Bug Fixing', targetDays: 10, completedBy: 0, avgDaysToComplete: 0 },
          { name: 'Code Review dengan Mentor', targetDays: 5, completedBy: 0, avgDaysToComplete: 0 },
          { name: 'Dokumentasi Project', targetDays: 7, completedBy: 0, avgDaysToComplete: 0 },
          { name: 'Deployment ke Production', targetDays: 5, completedBy: 0, avgDaysToComplete: 0 }
        ],
        monthlyTargets: [
          {
            month: 'September 2025',
            targetActivities: ['Memahami Struktur Project', 'Setup Development Environment'],
            completedCount: 2,
            totalCount: 2
          },
          {
            month: 'Oktober 2025',
            targetActivities: ['Implementasi Fitur Login', 'Integrasi API Backend'],
            completedCount: 1,
            totalCount: 2
          },
          {
            month: 'November 2025',
            targetActivities: ['Testing & Bug Fixing', 'Code Review dengan Mentor'],
            completedCount: 0,
            totalCount: 2
          },
          {
            month: 'Desember 2025',
            targetActivities: ['Dokumentasi Project', 'Deployment ke Production'],
            completedCount: 0,
            totalCount: 2
          }
        ],
        overallProgress: 37.5
      }
    ];

    setProjects(mockProjects);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = projects;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  };

  const handleEditTimeline = (project: Project) => {
    setSelectedProject(project);
    setShowEditDialog(true);
  };

  const handleUpdateTimeline = (projectId: string, timelineData: any) => {
    console.log('Updating timeline:', projectId, timelineData);
    // TODO: Update in Supabase
    setShowEditDialog(false);
    setSelectedProject(null);
    loadProjects();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'completed':
        return <Badge className="bg-gray-600">Completed</Badge>;
      case 'planning':
        return <Badge className="bg-blue-600">Planning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const planningCount = projects.filter(p => p.status === 'planning').length;

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
        <h1 className="text-3xl font-bold">Kelola Proyek</h1>
        <p className="text-muted-foreground mt-2">
          Manage project timeline, monthly targets, dan progress key activities
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
                placeholder="Cari project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({projects.length})
              </Button>
              <Button
                variant={statusFilter === 'planning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('planning')}
              >
                Planning ({planningCount})
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

      {/* Project Cards */}
      <div className="space-y-6">
        {filteredProjects.map((project) => {
          const daysRemaining = getDaysRemaining(project.endDate);
          const completedActivities = project.keyActivities.filter(a => a.completedBy > 0).length;

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTimeline(project)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Timeline
                  </Button>
                </div>

                {/* Project Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Period</p>
                      <p className="text-sm font-medium">
                        {format(new Date(project.startDate), 'dd MMM', { locale: idLocale })} - 
                        {format(new Date(project.endDate), 'dd MMM yyyy', { locale: idLocale })}
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
                      <p className="text-xs text-gray-500">Interns</p>
                      <p className="text-sm font-medium">{project.internCount}/{project.targetInterns}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Progress</p>
                      <p className="text-sm font-medium">{project.overallProgress}%</p>
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
                      {completedActivities}/{project.keyActivities.length} activities completed
                    </span>
                  </div>
                  <Progress value={project.overallProgress} className="h-3" />
                </div>

                {/* Monthly Targets */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold">Monthly Targets</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {project.monthlyTargets.map((target, index) => {
                      const progress = target.totalCount > 0 
                        ? Math.round((target.completedCount / target.totalCount) * 100)
                        : 0;
                      
                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                          <p className="text-xs font-semibold text-gray-700 mb-2">{target.month}</p>
                          <div className="space-y-1">
                            {target.targetActivities.map((activity, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-xs">
                                <CheckCircle2 className={`w-3 h-3 ${
                                  idx < target.completedCount ? 'text-green-600' : 'text-gray-300'
                                }`} />
                                <span className="text-gray-600 truncate">{activity}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2">
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-xs text-gray-500 mt-1">
                              {target.completedCount}/{target.totalCount} done
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key Activities Progress */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold">Key Activities Progress</h4>
                  </div>
                  <div className="space-y-2">
                    {project.keyActivities.map((activity, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                              <span>Target: {activity.targetDays} hari</span>
                              {activity.completedBy > 0 && (
                                <>
                                  <span>•</span>
                                  <span>Completed by: {activity.completedBy} intern(s)</span>
                                  <span>•</span>
                                  <span>Avg: {activity.avgDaysToComplete} hari</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Completion</p>
                            <p className="text-sm font-bold">
                              {project.internCount > 0 
                                ? Math.round((activity.completedBy / project.internCount) * 100)
                                : 0}%
                            </p>
                          </div>
                        </div>
                        <Progress 
                          value={project.internCount > 0 
                            ? (activity.completedBy / project.internCount) * 100
                            : 0
                          } 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Timeline Dialog */}
      <EditProjectTimelineDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={selectedProject}
        onSubmit={handleUpdateTimeline}
      />
    </div>
  );
}
