// =========================================
// PROJECT PROGRESS JOURNEY VISUALIZATION
// Visual timeline showing task completion progress
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase';
import { CheckCircle2, Circle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface TaskProgress {
  id: string;
  title: string;
  project_weight: number;
  is_reviewed: boolean;
  is_rejected: boolean;
  is_submitted: boolean;
  deadline?: string;
  created_at: string;
}

interface ProjectProgressJourneyProps {
  projectId: string;
  startDate: string;
  endDate: string;
}

export function ProjectProgressJourney({
  projectId,
  startDate,
  endDate,
}: ProjectProgressJourneyProps) {
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWeight: 0,
    completedWeight: 0,
    progressPercentage: 0,
  });

  useEffect(() => {
    loadTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, project_weight, is_reviewed, is_rejected, is_submitted, deadline, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const taskList = data || [];
      setTasks(taskList);

      // Calculate stats
      const totalWeight = taskList.reduce((sum, t) => sum + (t.project_weight || 0), 0);
      const completedWeight = taskList
        .filter(t => t.is_reviewed && !t.is_rejected)
        .reduce((sum, t) => sum + (t.project_weight || 0), 0);
      const progressPercentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

      setStats({
        totalWeight,
        completedWeight,
        progressPercentage,
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (task: TaskProgress) => {
    if (task.is_reviewed && !task.is_rejected) {
      return { label: 'Completed', icon: CheckCircle2, color: 'text-green-600 bg-green-50', borderColor: 'border-green-600' };
    }
    if (task.is_rejected) {
      return { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50', borderColor: 'border-red-600' };
    }
    if (task.is_submitted) {
      return { label: 'Under Review', icon: Clock, color: 'text-yellow-600 bg-yellow-50', borderColor: 'border-yellow-600' };
    }
    return { label: 'Pending', icon: Circle, color: 'text-gray-400 bg-gray-50', borderColor: 'border-gray-300' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Project Journey & Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Overall Progress</span>
            <Badge variant="outline" className="text-lg font-bold">
              {stats.progressPercentage}%
            </Badge>
          </div>
          
          {/* Journey Timeline */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {format(new Date(startDate), 'dd MMM yyyy')}
              </span>
              <div className="flex-1 relative h-10 bg-gray-200 rounded-full overflow-hidden">
                {/* Progress fill */}
                <div 
                  className="absolute h-full bg-gradient-to-r from-blue-500 via-blue-600 to-green-500 transition-all duration-500"
                  style={{ width: `${stats.progressPercentage}%` }}
                />
                
                {/* Milestone markers for completed tasks */}
                {tasks.map((task, index) => {
                  const status = getTaskStatus(task);
                  if (status.label !== 'Completed') return null;
                  
                  // Calculate position based on cumulative weight
                  const cumulativeWeight = tasks
                    .slice(0, index + 1)
                    .filter(t => t.is_reviewed && !t.is_rejected)
                    .reduce((sum, t) => sum + (t.project_weight || 0), 0);
                  const position = stats.totalWeight > 0 ? (cumulativeWeight / stats.totalWeight) * 100 : 0;
                  
                  return (
                    <div
                      key={task.id}
                      className="absolute top-0 bottom-0 flex items-center"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="w-1 h-full bg-white opacity-50" />
                    </div>
                  );
                })}
                
                {/* Progress text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {stats.completedWeight} / {stats.totalWeight} weight completed
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {format(new Date(endDate), 'dd MMM yyyy')}
              </span>
            </div>
          </div>
        </div>

        {/* Task Breakdown */}
        <div>
          <h4 className="font-semibold mb-3">Task Breakdown</h4>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const status = getTaskStatus(task);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 border-l-4 rounded-lg ${status.borderColor} bg-gray-50`}
                  >
                    <div className={`p-2 rounded-full ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{task.title}</p>
                          {task.deadline && (
                            <p className="text-xs text-gray-500 mt-1">
                              Deadline: {format(new Date(task.deadline), 'dd MMM yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-xs">
                            Weight: {task.project_weight}
                          </Badge>
                          <Badge className={`text-xs ${status.color.replace('bg-', 'bg-opacity-100 ')}`}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.is_reviewed && !t.is_rejected).length}
            </p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {tasks.filter(t => t.is_submitted && !t.is_reviewed).length}
            </p>
            <p className="text-xs text-gray-600">Under Review</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {tasks.filter(t => !t.is_submitted && !t.is_reviewed).length}
            </p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
