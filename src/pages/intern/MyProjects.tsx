// =========================================
// PROJECT SAYA PAGE - Comprehensive Project View
// Show project info, timeline, key activities, reports, and team
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Calendar,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  ListChecks,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  Star,
  User
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface KeyActivity {
  name: string;
  targetDays: number;
  isCompleted: boolean;
  completedAt?: string;
  daysToComplete?: number;
}

interface WeeklyReport {
  weekNumber: number;
  period: string;
  status: 'pending' | 'reviewed';
  rating?: number;
  submittedAt: string;
}

interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  mentorName: string;
  status: 'active' | 'completed' | 'upcoming';
  overallProgress: number;
  keyActivities: KeyActivity[];
  weeklyReports: WeeklyReport[];
  teamMembers: TeamMember[];
  totalTargetDays: number;
}

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [activeTab, projects]);

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
        status: 'active',
        overallProgress: 37.5,
        totalTargetDays: 65,
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
        weeklyReports: [
          { weekNumber: 12, period: '21-27 Oct', status: 'reviewed', rating: 5, submittedAt: '2025-10-27' },
          { weekNumber: 11, period: '14-20 Oct', status: 'reviewed', rating: 4, submittedAt: '2025-10-20' },
          { weekNumber: 13, period: '28 Oct-3 Nov', status: 'pending', submittedAt: '2025-10-30' }
        ],
        teamMembers: [
          { name: 'John Smith', role: 'Mentor' },
          { name: 'You', role: 'Intern' },
          { name: 'Jane Doe', role: 'Intern' }
        ]
      },
      {
        id: '2',
        name: 'Project Beta',
        description: 'Mobile application development for customer service',
        startDate: '2025-10-01',
        endDate: '2025-11-30',
        mentorName: 'Sarah Johnson',
        status: 'active',
        overallProgress: 60,
        totalTargetDays: 45,
        keyActivities: [
          { name: 'UI/UX Design', targetDays: 10, isCompleted: true, completedAt: '2025-10-08', daysToComplete: 8 },
          { name: 'Frontend Development', targetDays: 15, isCompleted: true, completedAt: '2025-10-20', daysToComplete: 12 },
          { name: 'Backend Integration', targetDays: 12, isCompleted: false },
          { name: 'Testing', targetDays: 8, isCompleted: false }
        ],
        weeklyReports: [
          { weekNumber: 10, period: '7-13 Oct', status: 'reviewed', rating: 4.5, submittedAt: '2025-10-13' }
        ],
        teamMembers: [
          { name: 'Sarah Johnson', role: 'Mentor' },
          { name: 'You', role: 'Intern' }
        ]
      }
    ];
    
    setProjects(mockProjects);
    setLoading(false);
  };

  const applyFilter = () => {
    if (activeTab === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter((p) => p.status === activeTab));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
      upcoming: { label: 'Upcoming', className: 'bg-yellow-100 text-yellow-700' },
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateDaysElapsed = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTimelineProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const today = new Date().getTime();
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    const total = end - start;
    const elapsed = today - start;
    return Math.round((elapsed / total) * 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Project Saya</h1>
        <p className="text-muted-foreground mt-2">
          Lihat progress project dan bandingkan laporan dengan target
        </p>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All Projects ({projects.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({projects.filter((p) => p.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({projects.filter((p) => p.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum ada project</h3>
                <p className="text-sm text-gray-600">Project yang diassign akan muncul di sini</p>
              </CardContent>
            </Card>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-5 h-5 text-green-600" />
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                      </div>
                      <CardDescription className="text-base">
                        {project.description}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Mentor: {project.mentorName}</span>
                      </div>
                    </div>
                    <Badge className={getStatusBadge(project.status).className}>
                      {getStatusBadge(project.status).label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Timeline with Remaining Days */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Timeline Project
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Start Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(project.startDate), 'dd MMM yyyy', { locale: idLocale })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">End Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(project.endDate), 'dd MMM yyyy', { locale: idLocale })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Timeline Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Timeline Progress</span>
                        <span>{calculateTimelineProgress(project.startDate, project.endDate)}%</span>
                      </div>
                      <Progress 
                        value={calculateTimelineProgress(project.startDate, project.endDate)} 
                        className="h-2 bg-gray-200"
                      />
                    </div>

                    {/* Days Info */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600">Days Elapsed</p>
                        <p className="text-lg font-bold text-blue-600">
                          {calculateDaysElapsed(project.startDate)}
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600">Days Remaining</p>
                        <p className={`text-lg font-bold ${
                          calculateDaysRemaining(project.endDate) < 7 ? 'text-red-600' : 
                          calculateDaysRemaining(project.endDate) < 30 ? 'text-orange-600' : 
                          'text-green-600'
                        }`}>
                          {calculateDaysRemaining(project.endDate)}
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600">Target Days</p>
                        <p className="text-lg font-bold text-gray-900">
                          {project.totalTargetDays}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Overall Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Work Progress</span>
                      <span className="text-2xl font-bold text-green-600">
                        {project.overallProgress}%
                      </span>
                    </div>
                    <Progress value={project.overallProgress} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">
                      {project.keyActivities.filter(a => a.isCompleted).length}/{project.keyActivities.length} key activities completed
                    </p>
                  </div>

                  {/* Key Activities Preview */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      Key Activities (from Mentor)
                    </h4>
                    <div className="space-y-2">
                      {project.keyActivities.slice(0, 3).map((activity, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${
                          activity.isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            {activity.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium">{activity.name}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1 ml-6">
                            Target: {activity.targetDays} hari
                            {activity.isCompleted && activity.daysToComplete && (
                              <span className={activity.daysToComplete <= activity.targetDays ? 'text-green-600 ml-2' : 'text-orange-600 ml-2'}>
                                • Actual: {activity.daysToComplete} hari
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {project.keyActivities.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{project.keyActivities.length - 3} more activities
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Weekly Reports Summary */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Recent Reports
                    </h4>
                    <div className="space-y-2">
                      {project.weeklyReports.slice(0, 3).map((report, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">Week {report.weekNumber}</span>
                            <span className="text-xs text-gray-600 ml-2">({report.period})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {report.status === 'reviewed' && report.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold">{report.rating}.0</span>
                              </div>
                            )}
                            <Badge className={report.status === 'reviewed' ? 'bg-green-600' : 'bg-yellow-600'}>
                              {report.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Team Members ({project.teamMembers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.teamMembers.map((member, idx) => (
                        <Badge key={idx} variant="outline" className="py-1">
                          {member.name} - {member.role}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      View Full Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
