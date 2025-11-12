// =========================================
// UPCOMING DEADLINES WIDGET
// Shows tasks/projects with approaching deadlines
// =========================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { format, differenceInDays, isToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// =========================================
// INTERFACES
// =========================================

interface DeadlineItem {
  id: string;
  title: string;
  deadline: string;
  type: 'task' | 'project';
  status?: string;
  daysRemaining: number;
}

interface UpcomingDeadlinesProps {
  userId?: string;
  limit?: number;
}

// =========================================
// MAIN COMPONENT
// =========================================

const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
  userId,
  limit = 5,
}) => {
  const navigate = useNavigate();
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================================
  // FETCH DEADLINES
  // =========================================

  const fetchDeadlines = useCallback(async () => {
    try {
      setLoading(true);
      const items: DeadlineItem[] = [];
      const now = new Date();

      // Fetch tasks with deadlines
      let taskQuery = supabase
        .from('tasks')
        .select('id, title, deadline, is_reviewed, is_rejected')
        .not('deadline', 'is', null)
        .gte('deadline', now.toISOString())
        .order('deadline', { ascending: true })
        .limit(limit);

      if (userId) {
        taskQuery = taskQuery.eq('assigned_to', userId);
      }

      const { data: tasks } = await taskQuery;

      if (tasks) {
        tasks.forEach((task) => {
          if (task.deadline) {
            const deadlineDate = new Date(task.deadline);
            const daysRemaining = differenceInDays(deadlineDate, now);

            items.push({
              id: task.id,
              title: task.title,
              deadline: task.deadline,
              type: 'task',
              status: task.is_reviewed
                ? task.is_rejected
                  ? 'rejected'
                  : 'approved'
                : 'pending',
              daysRemaining,
            });
          }
        });
      }

      // Fetch projects with deadlines
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, deadline, status')
        .not('deadline', 'is', null)
        .gte('deadline', now.toISOString())
        .order('deadline', { ascending: true })
        .limit(limit);

      if (projects) {
        projects.forEach((project) => {
          if (project.deadline) {
            const deadlineDate = new Date(project.deadline);
            const daysRemaining = differenceInDays(deadlineDate, now);

            items.push({
              id: project.id,
              title: project.name,
              deadline: project.deadline,
              type: 'project',
              status: project.status,
              daysRemaining,
            });
          }
        });
      }

      // Sort by deadline
      items.sort((a, b) => a.daysRemaining - b.daysRemaining);

      // Limit results
      setDeadlines(items.slice(0, limit));
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  // =========================================
  // UTILITY FUNCTIONS
  // =========================================

  const getUrgencyBadge = (daysRemaining: number) => {
    if (daysRemaining < 0 || isToday(new Date())) {
      return (
        <Badge className="bg-red-500 text-white flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </Badge>
      );
    }
    if (daysRemaining === 0) {
      return (
        <Badge className="bg-orange-500 text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Today
        </Badge>
      );
    }
    if (daysRemaining === 1) {
      return (
        <Badge className="bg-yellow-500 text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Tomorrow
        </Badge>
      );
    }
    if (daysRemaining <= 3) {
      return (
        <Badge className="bg-yellow-400 text-white">
          {daysRemaining} days
        </Badge>
      );
    }
    if (daysRemaining <= 7) {
      return (
        <Badge className="bg-blue-400 text-white">
          {daysRemaining} days
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-400 text-white">
        {daysRemaining} days
      </Badge>
    );
  };

  const handleItemClick = (item: DeadlineItem) => {
    if (item.type === 'task') {
      navigate(`/tasks/${item.id}`);
    } else {
      navigate(`/projects/${item.id}`);
    }
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Deadlines
        </CardTitle>
        <CardDescription>
          Tasks and projects due soon
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : deadlines.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming deadlines
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'task' ? '📋 Task' : '📁 Project'}
                      </Badge>
                      {getUrgencyBadge(item.daysRemaining)}
                    </div>
                    <h4 className="font-medium text-sm truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(item.deadline), 'dd MMM yyyy, HH:mm', {
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingDeadlines;
