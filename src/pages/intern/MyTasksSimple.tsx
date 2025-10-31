// =========================================
// INTERN - MY TASKS PAGE (SIMPLIFIED)
// =========================================

import { useEffect, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';

export default function MyTasksSimple() {
  const { fetchMyTasks, updateTaskProgress, loading } = useTasks();
  const [tasks, setTasks] = useState<any[]>([]);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const result = await fetchMyTasks();
    if (result.data) {
      setTasks(result.data);
    }
  };

  const handleProgressUpdate = async (taskId: string, newProgress: number) => {
    setUpdatingTaskId(taskId);
    const result = await updateTaskProgress(taskId, newProgress);
    if (!result.error) {
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, percent_of_project: newProgress }
          : task
      ));
    }
    setUpdatingTaskId(null);
  };

  const getTaskStatus = (task: any) => {
    if (task.percent_of_project === 100) return 'completed';
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline < 0) return 'overdue';
      if (daysUntilDeadline <= 3) return 'urgent';
    }
    return 'in-progress';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500">Urgent</Badge>;
      default:
        return <Badge className="bg-blue-500">In Progress</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'urgent':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Track and update your assigned tasks
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.percent_of_project === 100).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.percent_of_project < 100).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading tasks...</p>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No tasks assigned yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const status = getTaskStatus(task);
            return (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription>
                          {task.project?.name}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {task.description && (
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}

                  {/* Simple Progress Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{task.percent_of_project}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.percent_of_project}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Progress Buttons */}
                  {task.percent_of_project < 100 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProgressUpdate(task.id, Math.min(task.percent_of_project + 25, 100))}
                        disabled={updatingTaskId === task.id}
                      >
                        +25%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProgressUpdate(task.id, Math.min(task.percent_of_project + 50, 100))}
                        disabled={updatingTaskId === task.id}
                      >
                        +50%
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleProgressUpdate(task.id, 100)}
                        disabled={updatingTaskId === task.id}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  )}

                  {/* Task Details */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                    <div>
                      <span className="font-medium">Weight:</span> {task.percent_of_project}% of project
                    </div>
                    {task.deadline && (
                      <div>
                        <span className="font-medium">Deadline:</span>{' '}
                        {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
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
