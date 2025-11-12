// =========================================
// PROGRESS VISUALIZATION - Timeline Component
// Visual timeline with weight-based progress indicator
// Shows: start---|progress indicator (moves based on completed task weights)|---end
// =========================================

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  Flag
} from 'lucide-react';
import { getProjectProgressDetails } from '@/services/taskService';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Project } from '@/lib/api/types';

interface ProgressVisualizationProps {
  project: Project;
  showDetails?: boolean;
}

export function ProgressVisualization({ project, showDetails = true }: ProgressVisualizationProps) {
  const [progressData, setProgressData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    rejectedTasks: 0,
    totalWeight: 0,
    completedWeight: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadProgressData = useCallback(async () => {
    try {
      const details = await getProjectProgressDetails(project.id);
      setProgressData({
        totalTasks: details.totalTasks,
        completedTasks: details.completedTasks,
        pendingTasks: details.pendingTasks,
        rejectedTasks: details.rejectedTasks,
        totalWeight: details.totalWeight,
        completedWeight: details.completedWeight,
        percentage: details.totalWeight > 0 
          ? Math.round((details.completedWeight / details.totalWeight) * 100) 
          : 0,
      });
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const startDate = project.start_date ? new Date(project.start_date) : new Date();
  const endDate = project.end_date ? new Date(project.end_date) : new Date();
  const today = new Date();
  
  const totalDays = differenceInDays(endDate, startDate);
  const daysPassed = differenceInDays(today, startDate);
  const daysRemaining = differenceInDays(endDate, today);
  const timeProgress = totalDays > 0 ? Math.min(100, Math.max(0, (daysPassed / totalDays) * 100)) : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Project Progress
            </CardTitle>
            <CardDescription>Weight-based completion tracking</CardDescription>
          </div>
          <Badge 
            className={`text-lg px-4 py-1 ${
              progressData.percentage >= 100 ? 'bg-green-600' :
              progressData.percentage >= 75 ? 'bg-blue-600' :
              progressData.percentage >= 50 ? 'bg-yellow-600' :
              'bg-gray-600'
            }`}
          >
            {progressData.percentage}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Timeline Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-green-600" />
              <span className="font-medium">Start</span>
              <span className="text-gray-500">
                {format(startDate, 'dd MMM yyyy', { locale: idLocale })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                {format(endDate, 'dd MMM yyyy', { locale: idLocale })}
              </span>
              <span className="font-medium">End</span>
              <Flag className="w-4 h-4 text-red-600" />
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="relative">
            {/* Background track */}
            <div className="h-12 bg-gray-200 rounded-full relative overflow-hidden">
              {/* Completed progress (green) */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-700 ease-out"
                style={{ width: `${progressData.percentage}%` }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>

              {/* Time progress indicator (dashed line) */}
              <div 
                className="absolute inset-y-0 border-l-4 border-dashed border-blue-400 z-10 transition-all duration-500"
                style={{ left: `${timeProgress}%` }}
              >
                <div className="absolute -top-8 -left-12 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Today
                </div>
              </div>

              {/* Progress percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white drop-shadow-lg">
                  {progressData.completedWeight} / {progressData.totalWeight} weight completed
                </span>
              </div>
            </div>

            {/* Progress indicator dot */}
            <div 
              className="absolute -top-1 w-6 h-6 bg-green-600 rounded-full border-4 border-white shadow-lg transition-all duration-700 ease-out"
              style={{ 
                left: `calc(${progressData.percentage}% - 12px)`,
                transform: 'translateY(-50%)'
              }}
            />
          </div>

          {/* Progress bar */}
          <Progress value={progressData.percentage} className="h-2" />
        </div>

        {showDetails && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-medium text-blue-700">Total Tasks</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">{progressData.totalTasks}</p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-medium text-green-700">Completed</p>
                </div>
                <p className="text-2xl font-bold text-green-900">{progressData.completedTasks}</p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs font-medium text-yellow-700">Pending</p>
                </div>
                <p className="text-2xl font-bold text-yellow-900">{progressData.pendingTasks}</p>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-purple-700">Days Left</p>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {daysRemaining > 0 ? daysRemaining : 0}
                </p>
              </div>
            </div>

            {/* Timeline Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">Timeline Status</p>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Started {daysPassed} days ago</span>
                  <span>•</span>
                  <span>{daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Past deadline'}</span>
                  <span>•</span>
                  <span>{totalDays} days total</span>
                </div>
              </div>
              {progressData.percentage > timeProgress + 10 && (
                <Badge className="bg-green-600">Ahead of schedule ⚡</Badge>
              )}
              {progressData.percentage < timeProgress - 10 && (
                <Badge className="bg-red-600">Behind schedule ⚠️</Badge>
              )}
              {Math.abs(progressData.percentage - timeProgress) <= 10 && (
                <Badge className="bg-blue-600">On track 👍</Badge>
              )}
            </div>

            {/* Weight Distribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Task Weight Distribution</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed Weight</span>
                  <span className="font-medium text-green-600">
                    {progressData.completedWeight} / {progressData.totalWeight}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remaining Weight</span>
                  <span className="font-medium text-orange-600">
                    {progressData.totalWeight - progressData.completedWeight}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Average Weight per Task</span>
                  <span className="font-medium text-blue-600">
                    {progressData.totalTasks > 0 
                      ? (progressData.totalWeight / progressData.totalTasks).toFixed(1)
                      : '0'
                    }
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Add shimmer animation style */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </Card>
  );
}
