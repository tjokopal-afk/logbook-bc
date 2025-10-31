// =========================================
// PROGRESS SAYA PAGE - Intern View
// View mentor's project timeline and track key activities
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Users,
  Briefcase
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Mock data - replace with real data from Supabase
interface KeyActivity {
  name: string;
  targetDays: number;
  isCompleted: boolean;
  completedAt?: string;
  daysToComplete?: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  mentorName: string;
  targetInterns: number;
  keyActivities: KeyActivity[];
  overallProgress: number;
}

export default function ProgressSaya() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

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
        mentorName: 'John Smith',
        targetInterns: 3,
        keyActivities: [
          { name: 'Memahami Struktur Project', targetDays: 7, isCompleted: true, completedAt: '2025-09-05', daysToComplete: 5 },
          { name: 'Setup Development Environment', targetDays: 3, isCompleted: true, completedAt: '2025-09-07', daysToComplete: 2 },
          { name: 'Implementasi Fitur Login', targetDays: 14, isCompleted: true, completedAt: '2025-09-19', daysToComplete: 12 },
          { name: 'Integrasi API Backend', targetDays: 14, isCompleted: false },
          { name: 'Testing & Bug Fixing', targetDays: 10, isCompleted: false },
          { name: 'Code Review dengan Mentor', targetDays: 5, isCompleted: false },
          { name: 'Dokumentasi Project', targetDays: 7, isCompleted: false },
          { name: 'Deployment ke Production', targetDays: 5, isCompleted: false }
        ],
        overallProgress: 37.5
      },
      {
        id: '2',
        name: 'Project Beta',
        description: 'Mobile app development for customer service',
        startDate: '2025-09-15',
        endDate: '2025-12-15',
        mentorName: 'Jane Doe',
        targetInterns: 2,
        keyActivities: [
          { name: 'Memahami Struktur Project', targetDays: 5, isCompleted: false },
          { name: 'Setup Development Environment', targetDays: 3, isCompleted: false },
          { name: 'Implementasi UI/UX Design', targetDays: 10, isCompleted: false },
          { name: 'Integrasi API', targetDays: 12, isCompleted: false },
          { name: 'Testing', targetDays: 7, isCompleted: false },
          { name: 'Deployment', targetDays: 3, isCompleted: false }
        ],
        overallProgress: 0
      }
    ];

    setProjects(mockProjects);
    setLoading(false);
  };

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const getTotalTargetDays = (activities: KeyActivity[]) => {
    return activities.reduce((sum, act) => sum + act.targetDays, 0);
  };

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
        <h1 className="text-3xl font-bold">Progress Saya</h1>
        <p className="text-muted-foreground mt-2">
          Lihat timeline project dan target key activities dari mentor
        </p>
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {projects.map((project) => {
          const daysRemaining = getDaysRemaining(project.endDate);
          const totalTargetDays = getTotalTargetDays(project.keyActivities);
          const completedActivities = project.keyActivities.filter(a => a.isCompleted).length;
          const isExpanded = expandedProjects.has(project.id);

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <Badge className="bg-blue-600">Active</Badge>
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProjectExpand(project.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        View Details
                      </>
                    )}
                  </Button>
                </div>

                {/* Project Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Timeline</p>
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
                    <Target className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Total Target</p>
                      <p className="text-sm font-medium">{totalTargetDays} hari</p>
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

              <CardContent className="space-y-4">
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

                {/* Key Activities - Collapsed View */}
                {!isExpanded && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {project.keyActivities.length} key activities • Click "View Details" to see timeline
                    </p>
                  </div>
                )}

                {/* Key Activities - Expanded View */}
                {isExpanded && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold">Key Activities (Read-Only)</h4>
                      <Badge variant="outline" className="text-xs">Set by Mentor</Badge>
                    </div>
                    <div className="space-y-2">
                      {project.keyActivities.map((activity, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            activity.isCompleted
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {activity.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h5
                                    className={`font-medium ${
                                      activity.isCompleted ? 'text-green-900' : 'text-gray-900'
                                    }`}
                                  >
                                    {activity.name}
                                  </h5>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                    <span>Target: {activity.targetDays} hari</span>
                                    {activity.isCompleted && activity.daysToComplete && (
                                      <>
                                        <span>•</span>
                                        <span className={
                                          activity.daysToComplete <= activity.targetDays
                                            ? 'text-green-600 font-semibold'
                                            : 'text-orange-600 font-semibold'
                                        }>
                                          Actual: {activity.daysToComplete} hari
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {activity.isCompleted && (
                                  <Badge className="bg-green-600 text-xs">Completed</Badge>
                                )}
                              </div>
                              {activity.completedAt && (
                                <p className="text-xs text-green-600 mt-2">
                                  ✓ Completed: {format(new Date(activity.completedAt), 'dd MMM yyyy', { locale: idLocale })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mentor Info */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Users className="w-4 h-4" />
                        <span>
                          <span className="font-semibold">Mentor:</span> {project.mentorName} • 
                          <span className="font-semibold ml-1">Target Interns:</span> {project.targetInterns}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        Timeline dan target days di-set oleh mentor. Kamu bisa lihat progress-mu di sini.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
