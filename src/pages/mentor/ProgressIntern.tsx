// =========================================
// PROGRESS INTERN PAGE - Mentor View
// Monitor performance and progress of interns
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  TrendingUp,
  Clock, 
  FileText, 
  CheckCircle2,
  Star,
  Calendar,
  AlertCircle,
  Download,
  MessageSquare,
  Eye,
  BarChart3,
  Building2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { EnhancedStatCard } from '@/components/common/EnhancedStatCard';

// Mock data - replace with real Supabase data
interface InternProgress {
  id: string;
  name: string;
  avatar?: string;
  affiliation: string;
  projectName: string;
  startDate: string;
  endDate: string;
  totalReports: number;
  totalHours: number;
  totalTasks: number;
  completedTasks: number;
  avgRating: number;
  completedKeyActivities: number;
  totalKeyActivities: number;
  lastActivityDate: string;
  status: 'active' | 'at-risk' | 'inactive';
}

export default function ProgressIntern() {
  const [interns, setInterns] = useState<InternProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterns();
  }, []);

  const loadInterns = async () => {
    setLoading(true);
    // TODO: Replace with real Supabase query
    const mockInterns: InternProgress[] = [
      {
        id: '1',
        name: 'John Doe',
        avatar: '',
        affiliation: 'PT Telkom Indonesia',
        projectName: 'Project Alpha',
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        totalReports: 12,
        totalHours: 156,
        totalTasks: 20,
        completedTasks: 15,
        avgRating: 4.2,
        completedKeyActivities: 5,
        totalKeyActivities: 8,
        lastActivityDate: '2025-10-28',
        status: 'active'
      },
      {
        id: '2',
        name: 'Jane Smith',
        avatar: '',
        affiliation: 'Universitas Indonesia',
        projectName: 'Project Beta',
        startDate: '2025-09-15',
        endDate: '2025-12-15',
        totalReports: 8,
        totalHours: 98,
        totalTasks: 15,
        completedTasks: 12,
        avgRating: 4.8,
        completedKeyActivities: 6,
        totalKeyActivities: 8,
        lastActivityDate: '2025-10-29',
        status: 'active'
      },
      {
        id: '3',
        name: 'Ahmad Rizki',
        avatar: '',
        affiliation: 'Institut Teknologi Bandung',
        projectName: 'Project Alpha',
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        totalReports: 6,
        totalHours: 72,
        totalTasks: 18,
        completedTasks: 8,
        avgRating: 3.5,
        completedKeyActivities: 3,
        totalKeyActivities: 8,
        lastActivityDate: '2025-10-20',
        status: 'at-risk'
      },
      {
        id: '4',
        name: 'Sarah Johnson',
        avatar: '',
        affiliation: 'Universitas Gadjah Mada',
        projectName: 'Project Gamma',
        startDate: '2025-08-15',
        endDate: '2025-11-15',
        totalReports: 15,
        totalHours: 195,
        totalTasks: 25,
        completedTasks: 22,
        avgRating: 4.5,
        completedKeyActivities: 7,
        totalKeyActivities: 8,
        lastActivityDate: '2025-10-29',
        status: 'active'
      }
    ];

    setInterns(mockInterns);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'at-risk':
        return <Badge className="bg-orange-600">At Risk</Badge>;
      case 'inactive':
        return <Badge className="bg-red-600">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const getTaskCompletionRate = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getKeyActivityProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Calculate overall metrics
  const totalInterns = interns.length;
  const activeInterns = interns.filter(i => i.status === 'active').length;
  const atRiskInterns = interns.filter(i => i.status === 'at-risk').length;
  const avgCompletionRate = interns.length > 0
    ? Math.round(interns.reduce((sum, i) => sum + getTaskCompletionRate(i.completedTasks, i.totalTasks), 0) / interns.length)
    : 0;

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
        <h1 className="text-3xl font-bold">Progress Intern</h1>
        <p className="text-muted-foreground mt-2">
          Monitor perkembangan dan performa intern dalam bimbingan
        </p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnhancedStatCard
          title="Total Intern"
          value={totalInterns}
          icon={TrendingUp}
          color="blue"
          subtitle="Dalam bimbingan"
        />
        <EnhancedStatCard
          title="Active Interns"
          value={activeInterns}
          icon={CheckCircle2}
          color="green"
          subtitle={`${atRiskInterns} at risk`}
        />
        <EnhancedStatCard
          title="Avg Completion"
          value={`${avgCompletionRate}%`}
          icon={BarChart3}
          color="purple"
          subtitle="Task completion rate"
        />
        <EnhancedStatCard
          title="This Week"
          value={interns.reduce((sum, i) => sum + i.totalReports, 0)}
          icon={FileText}
          color="yellow"
          subtitle="Total reports submitted"
        />
      </div>

      {/* Intern Cards */}
      <div className="space-y-4">
        {interns.map((intern) => {
          const taskCompletionRate = getTaskCompletionRate(intern.completedTasks, intern.totalTasks);
          const keyActivityProgress = getKeyActivityProgress(intern.completedKeyActivities, intern.totalKeyActivities);
          const daysRemaining = getDaysRemaining(intern.endDate);
          const daysSinceLastActivity = differenceInDays(new Date(), new Date(intern.lastActivityDate));

          return (
            <Card key={intern.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  {/* Intern Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={intern.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                        {intern.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{intern.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {intern.affiliation}
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {intern.projectName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(intern.startDate), 'dd MMM yyyy', { locale: idLocale })} - 
                        {format(new Date(intern.endDate), 'dd MMM yyyy', { locale: idLocale })}
                        <span className="text-blue-600 font-medium">({daysRemaining} hari tersisa)</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {getStatusBadge(intern.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Total Laporan</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-gray-900">{intern.totalReports}</p>
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Total Jam</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-gray-900">{intern.totalHours}h</p>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">Avg {(intern.totalHours / Math.max(intern.totalReports, 1)).toFixed(1)}h/week</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Task Completion</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-gray-900">{taskCompletionRate}%</p>
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">{intern.completedTasks}/{intern.totalTasks} tasks</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Avg Rating</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-gray-900">{intern.avgRating.toFixed(1)}</p>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= Math.round(intern.avgRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Activities Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Key Activities Progress
                    </span>
                    <span className="text-sm text-gray-600">
                      {intern.completedKeyActivities}/{intern.totalKeyActivities}
                    </span>
                  </div>
                  <Progress value={keyActivityProgress} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">{keyActivityProgress}% completed</p>
                </div>

                {/* Last Activity */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Last activity:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(intern.lastActivityDate), 'dd MMM yyyy', { locale: idLocale })}
                    </span>
                  </div>
                  {daysSinceLastActivity > 7 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">{daysSinceLastActivity} days ago</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Comparison Chart
          </CardTitle>
          <CardDescription>
            Perbandingan performa antar intern
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interns.map((intern) => {
              const taskCompletionRate = getTaskCompletionRate(intern.completedTasks, intern.totalTasks);
              return (
                <div key={intern.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {intern.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{intern.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{intern.totalHours}h</span>
                      <span>{taskCompletionRate}%</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {intern.avgRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <Progress value={taskCompletionRate} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
