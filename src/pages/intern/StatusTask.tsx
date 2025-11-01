// =========================================
// STATUS TASK PAGE - Intern View
// View and update task status after submission
// =========================================

import { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, Clock, Calendar, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type TaskStatus = 'all' | 'not_started' | 'in_progress' | 'completed' | 'overdue';

interface TaskWithStatus {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  percent_of_project: number;
  created_at: string;
  project?: { id: string; name: string };
  status: TaskStatus;
}

export default function StatusTask() {
  const { fetchMyTasks, loading } = useTasks();
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [filter, setFilter] = useState<TaskStatus>('all');
  const [filteredTasks, setFilteredTasks] = useState<TaskWithStatus[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, tasks]);

  const loadTasks = async () => {
    const result = await fetchMyTasks();
    if (result.data) {
      const tasksWithStatus = result.data.map((task) => ({
        ...task,
        status: calculateStatus(task),
      }));
      setTasks(tasksWithStatus);
    }
  };

  const calculateStatus = (task: any): TaskStatus => {
    if (task.deadline && isPast(new Date(task.deadline)) && task.percent_of_project < 100) {
      return 'overdue';
    }
    if (task.percent_of_project === 100) return 'completed';
    if (task.percent_of_project > 0) return 'in_progress';
    return 'not_started';
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === filter));
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    const badges = {
      not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-700' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700' },
      all: { label: 'All', className: 'bg-gray-100 text-gray-700' },
    };
    return badges[status];
  };

  const getStatusCount = (status: TaskStatus) => {
    if (status === 'all') return tasks.length;
    return tasks.filter((t) => t.status === status).length;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Status Task</h1>
        <p className="text-muted-foreground mt-2">
          Lihat dan update status task yang telah diassign kepada Anda
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'in_progress', 'completed', 'not_started', 'overdue'] as TaskStatus[]).map(
          (status) => {
            const badge = getStatusBadge(status);
            const count = getStatusCount(status);
            return (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status)}
                className="gap-2"
              >
                {badge.label}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </Button>
            );
          }
        )}
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'Belum ada task' : `Tidak ada task ${getStatusBadge(filter).label.toLowerCase()}`}
            </h3>
            <p className="text-sm text-gray-600 text-center max-w-md">
              {filter === 'all'
                ? 'Task yang diassign kepada Anda akan muncul di sini'
                : 'Coba filter lain untuk melihat task'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {task.project && (
                      <Badge variant="outline" className="mb-2">
                        {task.project.name}
                      </Badge>
                    )}
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    {task.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {task.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge className={getStatusBadge(task.status).className}>
                    {getStatusBadge(task.status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{task.percent_of_project}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        task.status === 'completed'
                          ? 'bg-green-600'
                          : task.status === 'overdue'
                          ? 'bg-red-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${task.percent_of_project}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Assigned {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: idLocale })}
                    </span>
                  </div>
                  {task.deadline && (
                    <div className="flex items-center gap-1">
                      {task.status === 'overdue' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span className={task.status === 'overdue' ? 'text-red-600 font-semibold' : ''}>
                        Deadline: {format(new Date(task.deadline), 'dd MMM yyyy', { locale: idLocale })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  variant={task.status === 'completed' ? 'outline' : 'default'}
                  disabled={task.status === 'completed'}
                >
                  {task.status === 'completed' ? 'Task Completed' : 'Update Status'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
