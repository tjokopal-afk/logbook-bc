// =========================================
// PROJECT MILESTONE TIMELINE
// Horizontal visualization showing project progress milestones
// Format: Start 0--------0 (Milestones) ------------------0 End
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase';
import { Flag, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Task {
  id: string;
  title: string;
  deadline?: string;
  is_reviewed: boolean;
  is_rejected: boolean;
  // Supabase/PG numeric fields sometimes come back as strings — accept both
  project_weight: number | string;
}

interface Milestone {
  id: string;
  title: string;
  date: Date;
  position: number; // 0-100 representing position on timeline
  isCompleted: boolean;
  type: 'start' | 'task' | 'end';
  weight?: number;
}

interface ProjectMilestoneTimelineProps {
  projectId: string;
  startDate?: string;
  endDate?: string;
}

export function ProjectMilestoneTimeline({ 
  projectId, 
  startDate, 
  endDate 
}: ProjectMilestoneTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    loadMilestones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, startDate, endDate]);

  const loadMilestones = async () => {
    setLoading(true);
    try {
      if (!startDate || !endDate) {
        setLoading(false);
        return;
      }

      const start = parseISO(startDate);
      const end = parseISO(endDate);

      // Fetch all tasks
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, title, deadline, is_reviewed, is_rejected, project_weight')
        .eq('project_id', projectId)
        .order('deadline', { ascending: true });

      const taskList: Task[] = (allTasks as Task[]) || [];

      // Calculate total weight of ALL tasks
      const totalWeight = taskList.reduce((sum: number, t: Task) => {
        const p = Number(t.project_weight) || 0;
        return sum + p;
      }, 0);

      // Calculate completed weight (reviewed and not rejected)
      const completedWeight = taskList
        .filter((t) => t.is_reviewed && !t.is_rejected)
        .reduce((sum: number, t: Task) => {
          const p = Number(t.project_weight) || 0;
          return sum + p;
        }, 0);

      // Project completion percentage: (completed weight / total weight) * 100
      const projectCompletionPercent = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

      const milestonesData: Milestone[] = [];

      // Add start milestone (left, 0%)
      milestonesData.push({
        id: 'start',
        title: 'Project Start',
        date: start,
        position: 0,
        isCompleted: true,
        type: 'start',
      });

      // Add single task milestone (middle, moves with completion %)
      // Position = project completion percentage
      milestonesData.push({
        id: 'tasks',
        title: 'Tasks Progress',
        date: new Date(), // Current date for now
        position: projectCompletionPercent,
        isCompleted: projectCompletionPercent >= 100,
        type: 'task',
        weight: completedWeight, // Show completed weight
      });

      // Add end milestone (right, 100%)
      milestonesData.push({
        id: 'end',
        title: 'Project End',
        date: end,
        position: 100,
        isCompleted: projectCompletionPercent >= 100,
        type: 'end',
      });

      const rate = projectCompletionPercent;

      setMilestones(milestonesData);
      setTasks(taskList); // Store all tasks for display
      setCompletionRate(rate);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading milestones...</p>
        </CardContent>
      </Card>
    );
  }

  if (!startDate || !endDate || milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Project Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {!startDate || !endDate 
                ? 'Set project start and end dates to see milestone timeline'
                : 'No tasks with deadlines yet'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const startMilestone = milestones.find(m => m.type === 'start');
  const endMilestone = milestones.find(m => m.type === 'end');
  const taskMilestone = milestones.find(m => m.type === 'task');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-gray-700" />
            Project Milestones
          </CardTitle>
          <Badge variant="outline" className="text-base font-normal border-gray-300 text-gray-700">
            {Math.round(completionRate)}% Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline Visualization */}
          <div className="relative pt-8 pb-4 px-4">
            {/* Timeline line - positioned to align with center of circles */}
            <div className="absolute top-[38px] left-0 right-0 h-0.5 bg-gray-300" />

            {/* Start milestone (left, 0%) */}
            {startMilestone && (
              <div 
                className="absolute" 
                style={{ left: '0%', top: '32px', transform: 'translateX(0)' }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white shadow-md relative z-10" />
                  <div className="mt-4 text-center">
                    <p className="text-xs font-medium text-gray-900">{startMilestone.title}</p>
                    <p className="text-xs text-gray-500">{format(startMilestone.date, 'MMM dd')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Single Task milestone (middle, moves with completion %) */}
            {taskMilestone && (
              <div 
                className="absolute group"
                style={{ 
                  left: `${taskMilestone.position}%`, 
                  top: '32px',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-3 h-3 rounded-full border-2 border-white shadow-md relative z-10 transition-transform hover:scale-150 ${
                      taskMilestone.isCompleted 
                        ? 'bg-gray-800' 
                        : 'bg-gray-800'
                    }`}
                  />
                  
                  {/* Tooltip on hover */}
                  <div className="absolute top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg z-20 whitespace-nowrap pointer-events-none">
                    <p className="font-semibold">{taskMilestone.title}</p>
                    <p className="text-gray-300">{Math.round(taskMilestone.position)}% Complete</p>
                    {taskMilestone.weight !== undefined && (
                      <p className="text-gray-300">Completed Weight: {Math.round(taskMilestone.weight)}</p>
                    )}
                    <span className="text-xs text-gray-400">
                      {taskMilestone.isCompleted ? '● All Tasks Complete' : '○ In Progress'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* End milestone (right, 100%) */}
            {endMilestone && (
              <div 
                className="absolute" 
                style={{ right: '0%', top: '32px', transform: 'translateX(0)' }}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md relative z-10 ${
                    completionRate >= 100 ? 'bg-gray-900' : 'bg-gray-400'
                  }`} />
                  <div className="mt-4 text-center">
                    <p className="text-xs font-medium text-gray-900">{endMilestone.title}</p>
                    <p className="text-xs text-gray-500">{format(endMilestone.date, 'MMM dd')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-900" />
              <span className="text-xs text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-xs text-gray-600">Pending</span>
            </div>
          </div>

          {/* Task List */}
          {tasks.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold mb-3 text-gray-700">Project Tasks</h4>
              <div className="space-y-2">
                {tasks.map((task) => {
                  const taskWeight = Number(task.project_weight) || 0;
                  const isCompleted = task.is_reviewed && !task.is_rejected;
                  
                  return (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-gray-900' : 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-700">{task.title}</span>
                        <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                          {taskWeight}%
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {task.deadline ? format(parseISO(task.deadline), 'MMM dd, yyyy') : 'No deadline'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
